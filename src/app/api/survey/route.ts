import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Survey ingestion (v11 WS-14). Append-only per session: the client upserts
 * its own sessionId as answers accumulate, flipping `completed` at the end.
 * Anonymised by design — no name, no IP stored; the optional email capture on
 * the thank-you screen goes to the waitlist store instead (source=survey).
 * This table is durable and is NEVER touched by the sandbox reset.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rl = rateLimit(request, "survey", { max: 120, windowMs: 10 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: { sessionId?: unknown; answers?: unknown; completed?: unknown; segment?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
  if (!sessionId || typeof body.answers !== "object" || body.answers === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: true, note: "no store" });
  try {
    const { db } = await import("@/lib/db");
    const answers = JSON.parse(JSON.stringify(body.answers).slice(0, 20_000)) as object;
    await db.surveyResponse.upsert({
      where: { sessionId },
      create: {
        sessionId,
        answers,
        completed: body.completed === true,
        ...(typeof body.segment === "string" ? { segment: body.segment.slice(0, 20) } : {}),
      },
      update: {
        answers,
        ...(body.completed === true ? { completed: true } : {}),
        ...(typeof body.segment === "string" ? { segment: body.segment.slice(0, 20) } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[survey] persist failed:", e);
    return NextResponse.json({ error: "Store failed" }, { status: 500 });
  }
}
