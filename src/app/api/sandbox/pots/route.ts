import { NextResponse } from "next/server";
import { createPot, stripCardData, type CreatePotInput, ensureHydrated, flushPersist } from "@/lib/sandbox/store";
import { saveWaitlistSignup } from "@/lib/waitlist";

/** Create a sandbox pot. Returns the share slug + the private manager key. */
export async function POST(request: Request): Promise<NextResponse> {
  await ensureHydrated();
  let body: Record<string, unknown>;
  try {
    body = stripCardData((await request.json()) as Record<string, unknown>);
  } catch {
    await flushPersist();
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  const b = body as Partial<CreatePotInput>;
  if (!b.title || !b.recipientName || !b.eventDate || !b.organiserName) {
    await flushPersist();
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
  }
  // "Register for launch" (optional field) doubles as a waitlist signup —
  // exactly the stated purpose ("we'll tell you when the real Kindled launches").
  if (typeof b.organiserEmail === "string" && b.organiserEmail.includes("@")) {
    await saveWaitlistSignup(b.organiserEmail.slice(0, 120), "sandbox");
  }
  const pot = createPot({
    title: String(b.title).slice(0, 80),
    recipientName: String(b.recipientName).slice(0, 40),
    occasion: String(b.occasion ?? "Celebration").slice(0, 40),
    eventDate: String(b.eventDate).slice(0, 10),
    isSurprise: !!b.isSurprise,
    isChildPot: !!b.isChildPot,
    starChartEnabled: !!b.starChartEnabled,
    organiserName: String(b.organiserName).slice(0, 40),
    ...(b.organiserEmail ? { organiserEmail: String(b.organiserEmail).slice(0, 120) } : {}),
    items: Array.isArray(b.items) ? b.items.slice(0, 12) : [],
    ...(b.ref ? { ref: String(b.ref) } : {}),
  });
  await flushPersist();
  return NextResponse.json({ slug: pot.slug, managerKey: pot.managerKey });
}
