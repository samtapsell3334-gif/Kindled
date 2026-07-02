import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * /beta console gate (v11 WS-13) — the SAME server-side pattern as /api/investor:
 * the data is returned only after PIN validation on the server; the PIN lives in
 * the BETA_PIN env var and never enters the client bundle. Rate-limited.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rl = rateLimit(request, "beta-gate", { max: 8, windowMs: 10 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  let body: { pin?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  const expected = process.env.BETA_PIN ?? "";
  if (!expected || body.pin !== expected) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ signups: [], survey: [], note: "DATABASE_URL not set" });
  }
  const { db } = await import("@/lib/db");
  const [signups, survey] = await Promise.all([
    db.waitlistSignup.findMany({ orderBy: { createdAt: "desc" }, select: { email: true, source: true, createdAt: true } }),
    db.surveyResponse.findMany({ orderBy: { createdAt: "desc" }, select: { sessionId: true, segment: true, answers: true, completed: true, createdAt: true } }),
  ]);
  return NextResponse.json({ signups, survey });
}
