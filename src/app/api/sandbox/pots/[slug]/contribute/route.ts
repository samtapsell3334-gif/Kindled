import { NextResponse } from "next/server";
import { contribute, stripCardData, logEvent, getPotBySlug } from "@/lib/sandbox/store";
import { viewFor } from "@/lib/sandbox/redact";

/**
 * Simulated contribution (guardrail 1): the payment sheet is pure-frontend theatre —
 * this endpoint accepts only {displayName, amount, message?, videoRef?, consent?, ref?}.
 * stripCardData removes any card-like keys/values BEFORE anything is read, and the
 * store asserts none survive. Nothing here ever touches a real payment rail.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  let body: Record<string, unknown>;
  try {
    body = stripCardData((await request.json()) as Record<string, unknown>);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1) {
    return NextResponse.json({ error: "Amount must be at least £1" }, { status: 422 });
  }
  try {
    const str = (v: unknown): string | undefined => (typeof v === "string" && v.length > 0 ? v : undefined);
    const { pot } = contribute(slug, {
      displayName: str(body.displayName) ?? "Someone",
      amount,
      ...(str(body.message) ? { message: str(body.message)! } : {}),
      ...(str(body.videoRef) ? { videoRef: str(body.videoRef)! } : {}),
      consent: !!body.consent,
      ...(str(body.ref) ? { ref: str(body.ref)! } : {}),
    });
    return NextResponse.json({ ok: true, view: viewFor(pot, "guest") });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

/** Contribution-started beacon (funnel step before the sheet). */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  const pot = getPotBySlug(slug);
  if (pot) {
    const step = new URL(request.url).searchParams.get("step");
    logEvent(step === "sheet" ? "payment_sheet_viewed" : "contribution_started", { potId: pot.id });
  }
  return new NextResponse(null, { status: 204 });
}
