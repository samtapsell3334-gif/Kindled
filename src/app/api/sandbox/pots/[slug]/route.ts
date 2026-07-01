import { NextResponse } from "next/server";
import { getPotBySlug, logEvent } from "@/lib/sandbox/store";
import { viewFor } from "@/lib/sandbox/redact";

/**
 * Viewer-aware pot view. Redaction happens HERE, server-side (guardrail 6):
 * - ?key=<managerKey>  → manager view (sealed messages stay counts-only until reveal)
 * - ?view=receiver     → the surprise-safe ambient view (no amounts in the payload)
 * - default            → guest view
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  const pot = getPotBySlug(slug);
  if (!pot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const ref = url.searchParams.get("ref");
  const role =
    key && key === pot.managerKey ? "manager"
    : url.searchParams.get("view") === "receiver" ? "receiver"
    : "guest";

  if (role !== "manager") {
    logEvent("pot_viewed", { potId: pot.id, ...(ref ? { ref } : {}), props: { role } });
  }
  return NextResponse.json(viewFor(pot, role));
}
