-- ─── Kindled — Kindle Memories (multi-media Kindle engine) ─────────────────────
-- Run:  npx prisma migrate deploy   (or  npx prisma db push)
-- Or paste directly into Supabase → SQL Editor.
-- Durable pointer + metadata for a video/voice Memory attached to a contribution.
-- The blob itself lives in object storage (Vercel Blob); this row makes it re-loadable.

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE "MemoryKind" AS ENUM ('VIDEO', 'VOICE');

-- ─── kindle_memories ──────────────────────────────────────────────────────────

CREATE TABLE "kindle_memories" (
  "id"             TEXT         NOT NULL,
  "contributionId" TEXT         NOT NULL,
  "kind"           "MemoryKind" NOT NULL,
  -- Playable CDN URL from the Blob store — object path is kindle/{contributionId}/{id}
  "url"            TEXT         NOT NULL,
  "mimeType"       TEXT         NOT NULL,
  "durationSec"    INTEGER      NOT NULL,
  "sizeBytes"      INTEGER      NOT NULL,
  "createdAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "kindle_memories_pkey"                PRIMARY KEY ("id"),
  CONSTRAINT "kindle_memories_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "contributions" ("id") ON DELETE CASCADE
);

CREATE INDEX "kindle_memories_contributionId_idx" ON "kindle_memories" ("contributionId");
