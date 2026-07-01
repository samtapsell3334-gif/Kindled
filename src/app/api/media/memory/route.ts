import { NextResponse } from "next/server";
import { persistMemory } from "@/lib/memory-repository";
import type { KindleMemory } from "@/lib/media-service";

/**
 * Persist a Kindle Memory row after its blob has been uploaded to storage. The client
 * calls this once `upload()` resolves, handing over the full metadata (kind, duration,
 * size) that the storage callback alone can't see. No-ops gracefully when no DB is
 * connected (see memory-repository).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let memory: KindleMemory;
  try {
    memory = (await request.json()) as KindleMemory;
  } catch {
    return NextResponse.json({ error: "Malformed JSON." }, { status: 400 });
  }

  if (!memory?.id || !memory?.contributionId || !memory?.url) {
    return NextResponse.json({ error: "Missing id, contributionId, or url." }, { status: 400 });
  }

  // TODO(auth): once user sessions exist, verify the caller owns `contributionId`
  // (db.contribution.findUnique → giverId check) before writing — never trust the
  // client-supplied contribution linkage. Mirrors the ownership rule in CLAUDE.md.

  try {
    await persistMemory(memory);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to persist memory." },
      { status: 500 },
    );
  }
}
