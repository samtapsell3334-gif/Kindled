import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Public waitlist count (v16.2) — the ONLY waitlist read that needs no
 * secret, because it exposes nothing but an aggregate number: no emails, no
 * sources, no timestamps. Backs the homepage's threshold-gated social-proof
 * counter. Recalculated on every request (no caching) so the figure shown
 * is always the genuine live count, never stale or invented.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const rl = rateLimit(request, "waitlist-count", { max: 60, windowMs: 10 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ count: 0 });
  const { db } = await import("@/lib/db");
  const count = await db.waitlistSignup.count();
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
