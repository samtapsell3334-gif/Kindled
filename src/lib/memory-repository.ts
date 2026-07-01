/**
 * MemoryRepository — durable persistence for Kindle Memories.
 *
 * The blob itself lives in object storage (Vercel Blob); this layer stores the row
 * that points at it, tied to a contribution, so a Memory re-loads across sessions and
 * devices (not just the object URL held in the capturing tab). Every function no-ops
 * (or returns empty) when DATABASE_URL is absent, so the demo/local flow keeps working
 * with no database configured — persistence simply switches on once a DB is connected.
 */

import { db } from "@/lib/db";
import type { KindleMemory, MediaKind } from "@/lib/media-service";

/** Persistence is live only once a database is connected. */
const DB_ENABLED = !!process.env.DATABASE_URL;

const toDbKind = (k: MediaKind): "VIDEO" | "VOICE" => (k === "video" ? "VIDEO" : "VOICE");
const fromDbKind = (k: "VIDEO" | "VOICE"): MediaKind => (k === "VIDEO" ? "video" : "voice");

interface MemoryRow {
  id: string;
  contributionId: string;
  kind: "VIDEO" | "VOICE";
  url: string;
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: Date;
}

const rowToMemory = (r: MemoryRow): KindleMemory => ({
  id: r.id,
  contributionId: r.contributionId,
  kind: fromDbKind(r.kind),
  url: r.url,
  mimeType: r.mimeType,
  durationSec: r.durationSec,
  sizeBytes: r.sizeBytes,
  createdAt: r.createdAt.getTime(),
});

/**
 * Upsert a Memory row (idempotent on the client-generated id, so a retried persist
 * never duplicates). Only durable, uploaded Memories should reach here — see
 * `uploadMemory` in media-service, which skips persistence for demo object URLs.
 */
export async function persistMemory(memory: KindleMemory): Promise<void> {
  if (!DB_ENABLED) return;
  await db.kindleMemory.upsert({
    where: { id: memory.id },
    create: {
      id: memory.id,
      contributionId: memory.contributionId,
      kind: toDbKind(memory.kind),
      url: memory.url,
      mimeType: memory.mimeType,
      durationSec: memory.durationSec,
      sizeBytes: memory.sizeBytes,
      createdAt: new Date(memory.createdAt),
    },
    update: { url: memory.url },
  });
}

/** All Memories on one contribution, oldest first. */
export async function getMemoriesForContribution(contributionId: string): Promise<KindleMemory[]> {
  if (!DB_ENABLED) return [];
  const rows = await db.kindleMemory.findMany({
    where: { contributionId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(rowToMemory);
}

/**
 * All Memories across a Fire's contributions, oldest first — the set the Reveal
 * weaves in once it is loaded from the database rather than in-memory demo state.
 */
export async function getMemoriesForPot(potId: string): Promise<KindleMemory[]> {
  if (!DB_ENABLED) return [];
  const rows = await db.kindleMemory.findMany({
    where: { contribution: { potId } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(rowToMemory);
}
