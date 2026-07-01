/**
 * MediaService — storage + attachment layer for the multi-media Kindle engine.
 *
 * A giver can attach a short video or voice "Memory" to their contribution; it is
 * securely tied to the contribution_id and surfaced in the recipient's Reveal.
 *
 * Storage is abstracted behind `uploadMemory` so the capture UI never knows whether
 * the blob is going to S3, Cloudinary, or (in the demo) a local object URL. In
 * production the flow is: (1) POST /api/media/sign → presigned PUT URL scoped to
 * `kindle/{contributionId}/{id}`; (2) PUT the blob directly to the bucket; (3) the
 * returned CDN URL is persisted on the Contribution row. No blob ever transits our
 * server, and the object key embeds the contribution_id so access is authorisable.
 */

export type MediaKind = "video" | "voice";

export interface KindleMemory {
  id: string;
  /** The contribution this Memory belongs to — the security + reveal linkage. */
  contributionId: string;
  kind: MediaKind;
  /** Playable URL (CDN in prod, object URL in the demo). */
  url: string;
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: number;
}

/** Best-supported MediaRecorder MIME type for a kind, or "" if unsupported. */
export function pickMimeType(kind: MediaKind): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = kind === "video"
    ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
    : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

/** getUserMedia constraints for each kind. */
export function mediaConstraints(kind: MediaKind): MediaStreamConstraints {
  return kind === "video"
    ? { video: { facingMode: "user", width: { ideal: 720 } }, audio: true }
    : { audio: true };
}

/**
 * Persist a recorded blob as a Memory tied to a contribution and return its ref.
 * Demo: wraps the blob in an object URL. Production: swap the body for the presigned
 * S3/Cloudinary PUT described above — the signature and return type stay identical.
 */
export async function uploadMemory(
  blob: Blob,
  meta: { contributionId: string; kind: MediaKind; durationSec: number },
): Promise<KindleMemory> {
  const id = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  // ── production storage (uncomment once the media API + bucket exist) ──
  // const key = `kindle/${meta.contributionId}/${id}`;
  // const { uploadUrl, cdnUrl } = await fetch("/api/media/sign", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ key, contentType: blob.type }),
  // }).then((r) => r.json());
  // await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": blob.type } });
  // const url = cdnUrl;

  // ── demo storage: local object URL (simulate upload latency) ──
  await new Promise((resolve) => setTimeout(resolve, 350));
  const url = URL.createObjectURL(blob);

  return {
    id,
    contributionId: meta.contributionId,
    kind: meta.kind,
    url,
    mimeType: blob.type || (meta.kind === "video" ? "video/webm" : "audio/webm"),
    durationSec: Math.round(meta.durationSec),
    sizeBytes: blob.size,
    createdAt: Date.now(),
  };
}

/** Max recording length — keeps Memories punchy and uploads small. */
export const MAX_MEMORY_SEC = 30;

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
