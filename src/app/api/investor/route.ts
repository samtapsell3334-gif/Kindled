import { NextResponse } from "next/server";
import content from "@/data/investor-content.json";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Investor content gate (server-side). The confidential deck is imported here, on
 * the server, and only returned when the correct PIN is supplied — so neither the
 * PIN nor the financials ever ship in the public client bundle. Set INVESTOR_PIN in
 * the environment; falls back to a dev default so the gate still works locally.
 *
 * Rate-limited (8 attempts / 10 min / IP — see src/lib/rate-limit.ts). PIN comes
 * from INVESTOR_PIN env (set in production; dev fallback below).
 */
const PIN = process.env.INVESTOR_PIN ?? "1066";

export async function POST(request: Request): Promise<NextResponse> {
  const rl = rateLimit(request, "investor-pin", { max: 8, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many attempts — try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }
  let pin: unknown;
  try {
    pin = ((await request.json()) as { pin?: unknown }).pin;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof pin !== "string" || pin !== PIN) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, content });
}
