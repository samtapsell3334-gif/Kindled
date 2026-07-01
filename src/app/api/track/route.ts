import { NextResponse } from "next/server";

/**
 * Funnel-event collector (P4.4). Consent-gated client-side (see src/lib/analytics.ts).
 * Currently logs to the server console — enough to validate the funnel wiring and to
 * tail in Vercel logs. TODO(founder): point this at a durable sink (Postgres table or
 * a privacy-respecting analytics service) when one is chosen.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const event = (await request.json()) as { event?: string };
    if (typeof event?.event !== "string" || event.event.length > 64) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    console.log("[track]", JSON.stringify(event));
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}
