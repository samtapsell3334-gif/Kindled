import { describe, it, expect } from "vitest";
import { viewFor } from "../sandbox/redact";
import { giftVisualFor } from "../sandbox/gift-visual";
import type { SandboxPot } from "../sandbox/types";

const surprisePot = (contributions: number): SandboxPot => ({
  id: "spot_test", slug: "testslug", managerKey: "key_test",
  title: "Ava's 8th Birthday", recipientName: "Ava", occasion: "Birthday",
  eventDate: "2026-08-14", isSurprise: true, isChildPot: true,
  starChartEnabled: false, organiserName: "Sarah", status: "open",
  items: [{ id: "item_1", name: "Telescope", price: 120, category: "Science", retailer: "John Lewis", priceBand: "100to500", source: "catalogue", approved: true }],
  contributions: Array.from({ length: contributions }, (_, i) => ({
    id: `con_${i}`, potId: "spot_test", displayName: `Giver ${i}`, amount: 20, createdAt: Date.now(),
  })),
  messages: [], createdAt: Date.now(),
});

describe("MaterialisingGift receiver/ambient safety (v9 acceptance)", () => {
  it("receiver view of an open surprise wish maps to ambient with no amount or percentage data", () => {
    const visual = giftVisualFor(viewFor(surprisePot(3), "receiver"));
    expect(visual.mode).toBe("ambient");
    // Structural check: the ambient props object carries exactly mode + activity —
    // no pct, raised, goal, or any numeric field a UI could accidentally render.
    expect(Object.keys(visual).sort()).toEqual(["activity", "mode"]);
    const serialised = JSON.stringify(visual);
    expect(serialised).not.toMatch(/pct|raised|goal|amount|%|\d/);
  });

  it("guest view maps to progress with the funded percentage", () => {
    const visual = giftVisualFor(viewFor(surprisePot(3), "guest"));
    expect(visual).toEqual({ mode: "progress", pct: 50 }); // 60 of 120
  });

  it("fully funded and revealed wishes map to complete", () => {
    const funded = surprisePot(6); // 120 of 120
    expect(giftVisualFor(viewFor(funded, "guest"))).toEqual({ mode: "complete" });
    const revealed = { ...surprisePot(2), status: "revealed" as const };
    expect(giftVisualFor(viewFor(revealed, "guest"))).toEqual({ mode: "complete" });
  });

  it("multi-wish occasions stay structurally amount-free on the receiver view (v11 WS-1)", () => {
    const pot = surprisePot(3);
    pot.items.push(
      { id: "item_2", name: "Star atlas", price: 18, category: "Books", retailer: "Waterstones", priceBand: "under25", source: "catalogue", approved: true },
      { id: "item_3", name: "Roller skates", price: 45, category: "Sports", retailer: "Decathlon", priceBand: "25to100", source: "catalogue", approved: true },
    );
    const view = viewFor(pot, "receiver");
    expect(view.kind).toBe("receiver_surprise");
    const json = JSON.stringify(view);
    for (const banned of ["raised", "goal", "amount", "price", "items", "granted", "120", "18", "45"]) {
      expect(json, banned).not.toContain(banned);
    }
  });

  it("ambient activity reflects contribution volume without exposing counts", () => {
    expect(giftVisualFor(viewFor(surprisePot(0), "receiver"))).toEqual({ mode: "ambient", activity: "quiet" });
    expect(giftVisualFor(viewFor(surprisePot(2), "receiver"))).toEqual({ mode: "ambient", activity: "warming" });
    expect(giftVisualFor(viewFor(surprisePot(5), "receiver"))).toEqual({ mode: "ambient", activity: "glowing" });
  });
});
