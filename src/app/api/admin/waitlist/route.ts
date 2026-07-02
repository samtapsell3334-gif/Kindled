import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Founder-only waitlist readout (v9.2). Same secret as the sandbox admin API:
 *   GET /api/admin/waitlist?secret=…  →  { count, signups: [{email, source, createdAt}] }
 * Rate-limited; returns nothing without the secret.
 */
const SECRET = process.env.SANDBOX_ADMIN_SECRET ?? "kindled-admin";

export async function GET(request: Request): Promise<NextResponse> {
  const rl = rateLimit(request, "admin-waitlist", { max: 20, windowMs: 10 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ count: 0, signups: [], note: "DATABASE_URL not set" });
  }
  const { db } = await import("@/lib/db");
  const signups = await db.waitlistSignup.findMany({
    orderBy: { createdAt: "desc" },
    select: { email: true, source: true, createdAt: true },
  });
  return NextResponse.json({ count: signups.length, signups });
}
