import { NextResponse } from "next/server";
import content from "@/data/investor-content.json";

/**
 * Investor content gate (server-side). The confidential deck is imported here, on
 * the server, and only returned when the correct PIN is supplied — so neither the
 * PIN nor the financials ever ship in the public client bundle. Set INVESTOR_PIN in
 * the environment; falls back to a dev default so the gate still works locally.
 *
 * TODO(founder): add basic rate-limiting/lockout on this route before raising, so a
 * 4-digit PIN can't be brute-forced, and rotate the PIN off the dev default.
 */
const PIN = process.env.INVESTOR_PIN ?? "1066";

export async function POST(request: Request): Promise<NextResponse> {
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
