/**
 * MediaService — storage + attachment layer for the multi-media Kindle engine.
 *
 * A giver can attach a short video or voice "Memory" to their contribution; it is
 * securely tied to the contribution_id and surfaced in the recipient's Reveal.
 *
 * Storage is abstracted behind `uploadMemory` so the capture UI never knows where the
 * blob lands. Two modes:
 *
 *  • Real (Vercel Blob) — when NEXT_PUBLIC_BLOB_ENABLED="1". The browser calls
 *    `upload(...)`, which brokers a scoped token via /api/media/upload and streams the
 *    blob browser → Blob store directly (nothing transits our server). The object
 *    pathname is `kindle/{contributionId}/{id}` so the Memory stays linked + authorisable.
 *  • Demo — otherwise, or if a real upload fails: a local object URL (device-only,
 *    lost on refresh) so the capture flow always works without any storage configured.
 */

/** Real durable storage is on once a Vercel Blob store exists and this flag is set. */
const BLOB_ENABLED = process.env.NEXT_PUBLIC_BLOB_ENABLED === "1";

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
 * Routes to Vercel Blob when enabled, else a local object URL (demo). The return
 * shape is identical either way, so the capture UI and Reveal never change.
 */
export async function uploadMemory(
  blob: Blob,
  meta: { contributionId: string; kind: MediaKind; durationSec: number },
): Promise<KindleMemory> {
  const id = `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const mimeType = blob.type || (meta.kind === "video" ? "video/webm" : "audio/webm");
  const url = await storeBlob(blob, `kindle/${meta.contributionId}/${id}`, mimeType);

  return {
    id,
    contributionId: meta.contributionId,
    kind: meta.kind,
    url,
    mimeType,
    durationSec: Math.round(meta.durationSec),
    sizeBytes: blob.size,
    createdAt: Date.now(),
  };
}

/**
 * Store a blob and return its playable URL. Vercel Blob (direct browser upload) when
 * configured; a local object URL otherwise, or if the real upload fails — so a giver's
 * Memory is never lost to a storage hiccup mid-capture.
 */
async function storeBlob(blob: Blob, pathname: string, contentType: string): Promise<string> {
  if (BLOB_ENABLED && typeof window !== "undefined") {
    try {
      const { upload } = await import("@vercel/blob/client");
      const result = await upload(pathname, blob, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
        contentType,
      });
      return result.url;
    } catch (err) {
      // Fall through to the local preview URL rather than breaking the capture flow.
      console.warn("[media] Blob upload failed — using local preview URL", err);
    }
  }

  // Demo storage: local object URL (simulate a little upload latency).
  await new Promise((resolve) => setTimeout(resolve, 350));
  return URL.createObjectURL(blob);
}

/** Max recording length — keeps Memories punchy and uploads small. */
export const MAX_MEMORY_SEC = 30;

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
