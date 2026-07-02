import { describe, it, expect } from "vitest";
import { createPot, circleItem, reviewItem } from "../sandbox/store";
import { viewFor } from "../sandbox/redact";

const makeChildPot = () =>
  createPot({
    title: "Ava's 8th Birthday", recipientName: "Ava", occasion: "Birthday",
    eventDate: "2026-08-14", isSurprise: true, isChildPot: true,
    starChartEnabled: true, organiserName: "Sarah",
    items: [{ name: "Telescope", price: 120, category: "Science", retailer: "John Lewis", priceBand: "100to500", source: "catalogue" }],
  });

const CRAYONS = { name: "Crayon mega set", price: 18, category: "Craft", retailer: "Hobbycraft", priceBand: "under25" as const };

describe("kids' circle-it + parent approval queue (P3.1)", () => {
  it("a circled item is pending: invisible to guests, queued for the parent, goal unchanged", () => {
    const pot = makeChildPot();
    circleItem(pot.slug, pot.managerKey, CRAYONS);
    const guest = viewFor(pot, "guest");
    if (guest.kind !== "guest") throw new Error("expected guest view");
    expect(guest.items.map((i) => i.name)).toEqual(["Telescope"]);
    expect(guest.goal).toBe(120);
    const mgr = viewFor(pot, "manager");
    if (mgr.kind !== "manager") throw new Error("expected manager view");
    expect(mgr.pendingItems.map((i) => i.name)).toEqual(["Crayon mega set"]);
  });

  it("parent approval makes the item live and grows the goal; rejection removes it", () => {
    const pot = makeChildPot();
    circleItem(pot.slug, pot.managerKey, CRAYONS);
    circleItem(pot.slug, pot.managerKey, { ...CRAYONS, name: "Roller skates", price: 45, priceBand: "25to100" });
    const mgr = viewFor(pot, "manager");
    if (mgr.kind !== "manager") throw new Error("expected manager view");
    const [crayons, skates] = mgr.pendingItems;
    reviewItem(pot.slug, pot.managerKey, crayons!.id, true);
    reviewItem(pot.slug, pot.managerKey, skates!.id, false);
    const guest = viewFor(pot, "guest");
    if (guest.kind !== "guest") throw new Error("expected guest view");
    expect(guest.items.map((i) => i.name).sort()).toEqual(["Crayon mega set", "Telescope"]);
    expect(guest.goal).toBe(138);
    expect(pot.items.some((i) => i.name === "Roller skates")).toBe(false);
  });

  it("circling requires the manager key and a child wish", () => {
    const pot = makeChildPot();
    expect(() => circleItem(pot.slug, "wrong-key", CRAYONS)).toThrow("Not authorised");
    const adult = createPot({
      title: "Leaving gift", recipientName: "Priya", occasion: "Leaving do",
      eventDate: "2026-08-14", isSurprise: true, isChildPot: false,
      starChartEnabled: false, organiserName: "Sam", items: [],
    });
    expect(() => circleItem(adult.slug, adult.managerKey, CRAYONS)).toThrow("Circling is for child wishes");
  });
});

describe("per-wish reveal defaults (v11 acceptance finding)", () => {
  it("unfunded wishes stack by default; funded wishes inherit the occasion outcome", async () => {
    const { simulateReveal, contribute } = await import("../sandbox/store");
    const pot = makeChildPot(); // Telescope £120, approved
    circleItem(pot.slug, pot.managerKey, CRAYONS); // £18, pending
    const mgrView = viewFor(pot, "manager");
    if (mgrView.kind !== "manager") throw new Error("expected manager");
    reviewItem(pot.slug, pot.managerKey, mgrView.pendingItems[0]!.id, true);
    // fully fund ONLY the crayons
    const crayonId = pot.items.find((i) => i.name === "Crayon mega set")!.id;
    contribute(pot.slug, { displayName: "Jean", amount: 18, itemId: crayonId });
    simulateReveal(pot.slug, pot.managerKey, "gift_card", { retailer: "Hobbycraft" });
    expect(pot.items.find((i) => i.name === "Crayon mega set")!.outcome).toBe("gift_card");
    expect(pot.items.find((i) => i.name === "Telescope")!.outcome).toBe("stack");
  });
});
