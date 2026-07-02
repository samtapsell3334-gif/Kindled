import { NextResponse } from "next/server";
import { circleItem, reviewItem, stripCardData, ensureHydrated, flushPersist } from "@/lib/sandbox/store";
import { viewFor } from "@/lib/sandbox/redact";

/**
 * Kids' "circle it" + parent approval queue (P3.1). Both actions require the
 * manager key — the child circles on the parent's device, and only the parent
 * approves. The circle payload is catalogue data only (no child free-text).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  await ensureHydrated();
  const { slug } = await params;
  let body: Record<string, unknown>;
  try {
    body = stripCardData((await request.json()) as Record<string, unknown>);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
  const key = typeof body.key === "string" ? body.key : "";
  try {
    if (body.action === "circle") {
      const raw = body.item as { name?: unknown; price?: unknown; category?: unknown; retailer?: unknown; priceBand?: unknown } | undefined;
      const name = typeof raw?.name === "string" ? raw.name.slice(0, 80) : "";
      const price = Number(raw?.price);
      if (!name || !Number.isFinite(price) || price < 1) {
        return NextResponse.json({ error: "Invalid item" }, { status: 422 });
      }
      const pot = circleItem(slug, key, {
        name,
        price: Math.round(price),
        category: typeof raw?.category === "string" ? raw.category : "Other",
        retailer: typeof raw?.retailer === "string" ? raw.retailer : "Catalogue",
        priceBand: price < 25 ? "under25" : price <= 100 ? "25to100" : price <= 500 ? "100to500" : "over500",
      });
      await flushPersist();
      return NextResponse.json({ ok: true, view: viewFor(pot, "manager") });
    }
    if (body.action === "approve" || body.action === "reject") {
      const itemId = typeof body.itemId === "string" ? body.itemId : "";
      const pot = reviewItem(slug, key, itemId, body.action === "approve");
      await flushPersist();
      return NextResponse.json({ ok: true, view: viewFor(pot, "manager") });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    await flushPersist();
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
