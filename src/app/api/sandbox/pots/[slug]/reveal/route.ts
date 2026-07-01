import { NextResponse } from "next/server";
import { simulateReveal } from "@/lib/sandbox/store";
import { viewFor } from "@/lib/sandbox/redact";
import type { RevealOutcome } from "@/lib/sandbox/types";

/** "Simulate reveal day" (WS-E) — manager-key gated; records the outcome + simulated commission. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  let body: { key?: string; outcome?: RevealOutcome; retailer?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  if (!body.key || !["gift_card", "product", "stack"].includes(body.outcome ?? "")) {
    return NextResponse.json({ error: "key and a valid outcome are required" }, { status: 422 });
  }
  try {
    const pot = simulateReveal(slug, body.key, body.outcome!, {
      ...(body.retailer ? { retailer: body.retailer } : {}),
    });
    return NextResponse.json({ ok: true, view: viewFor(pot, "manager") });
  } catch {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
}
