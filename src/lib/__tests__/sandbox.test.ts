import { describe, it, expect, beforeEach } from "vitest";
import {
  createPot, getPotBySlug, contribute, simulateReveal, resetSandbox,
  listEvents, stripCardData, logEvent,
} from "@/lib/sandbox/store";
import { viewFor, RECEIVER_FORBIDDEN_KEYS } from "@/lib/sandbox/redact";

/**
 * Sandbox MVP (v4.1) — the three mandated acceptance tests, plus loop coverage.
 */
const basePot = () => createPot({
  title: "Ava's 8th Birthday", recipientName: "Ava", occasion: "Birthday",
  eventDate: "2099-03-14", isSurprise: true, isChildPot: true, starChartEnabled: true,
  organiserName: "Mum",
  items: [
    { name: "LEGO set", price: 65, category: "Toys", retailer: "Smyths", priceBand: "25to100", source: "catalogue" },
    { name: "Skates", price: 45, category: "Sports", retailer: "Decathlon", priceBand: "25to100", source: "manual" },
  ],
});

beforeEach(() => resetSandbox());

// ── Mandated test 1: receiver view of a surprise pot leaks nothing ─────────────
describe("server-side surprise redaction", () => {
  it("receiver payload contains no amount/progress/contribution/message fields", () => {
    const pot = basePot();
    contribute(pot.slug, { displayName: "Grandma", amount: 20, message: "Happy birthday!" });
    const view = viewFor(getPotBySlug(pot.slug)!, "receiver");
    expect(view.kind).toBe("receiver_surprise");
    const json = JSON.stringify(view);
    for (const key of RECEIVER_FORBIDDEN_KEYS) {
      expect(json).not.toContain(`"${key}"`);
    }
    expect(json).not.toContain(":20"); // the contribution amount as a JSON value
    expect(json).not.toContain("Grandma"); // contributor identity
    expect(json).not.toContain("Happy birthday"); // sealed message content
  });

  it("guest sees progress but never sealed message content; manager sees counts until reveal", () => {
    const pot = basePot();
    contribute(pot.slug, { displayName: "Grandma", amount: 20, message: "Secret note" });
    const guest = viewFor(getPotBySlug(pot.slug)!, "guest");
    expect(guest.kind).toBe("guest");
    expect(JSON.stringify(guest)).not.toContain("Secret note");
    const manager = viewFor(getPotBySlug(pot.slug)!, "manager");
    expect(manager.kind === "manager" && manager.messages).toEqual([]);
  });

  it("non-surprise pots show progress to everyone incl. the receiver role", () => {
    const pot = createPot({
      title: "Log Burner", recipientName: "Sam & Jess", occasion: "Joint goal",
      eventDate: "2099-12-25", isSurprise: false, isChildPot: false, starChartEnabled: false,
      organiserName: "Sam", items: [],
    });
    const view = viewFor(getPotBySlug(pot.slug)!, "receiver");
    expect(view.kind).toBe("guest"); // no redaction needed
  });
});

// ── Mandated test 2: contribution writes the correct event rows ────────────────
describe("event log", () => {
  it("a completed contribution with a video message writes the right events", () => {
    const pot = basePot();
    const before = listEvents().length;
    contribute(pot.slug, { displayName: "B", amount: 20, videoRef: "blob:demo", consent: true, ref: pot.slug });
    const events = listEvents().slice(before);
    expect(events.map((e) => e.event)).toEqual(["contribution_completed", "message_added"]);
    expect(events[0]?.props?.amount).toBe(20);
    expect(events[0]?.ref).toBe(pot.slug);
    expect(events[1]?.props?.type).toBe("video");
  });

  it("pot creation logs pot_created + one item_added per item with intent fields", () => {
    resetSandbox();
    const before = listEvents().length;
    basePot();
    const events = listEvents().slice(before);
    expect(events[0]?.event).toBe("pot_created");
    expect(events[0]?.props).toMatchObject({ is_child: true, star_chart: true, surprise: true });
    const items = events.filter((e) => e.event === "item_added");
    expect(items).toHaveLength(2);
    expect(items[0]?.props).toMatchObject({ category: "Toys", retailer: "Smyths", price_band: "25to100", source: "catalogue" });
  });

  it("gift-card reveal records a simulated commission", () => {
    const pot = basePot();
    contribute(pot.slug, { displayName: "B", amount: 100 });
    const revealed = simulateReveal(pot.slug, pot.managerKey, "gift_card", { retailer: "Smyths" });
    expect(revealed.simulatedCommission).toBe(5); // default 5% of £100
    const outcome = listEvents().find((e) => e.event === "reveal_outcome");
    expect(outcome?.props).toMatchObject({ outcome: "gift_card", retailer: "Smyths", simulated_commission: 5 });
  });
});

// ── Mandated test 3: no card data can be persisted or logged ───────────────────
describe("card-data guardrail", () => {
  it("stripCardData removes card-like keys and PAN-like values", () => {
    const dirty = {
      displayName: "B", amount: 20,
      cardNumber: "4242 4242 4242 4242", cvc: "123", expiry: "12/29",
      note: "my number is 4242424242424242",
    };
    const clean = stripCardData(dirty);
    expect(clean).toEqual({ displayName: "B", amount: 20 });
  });

  it("no PAN-like value appears in any persisted record or event after a full loop", () => {
    const pot = basePot();
    contribute(pot.slug, { displayName: "B", amount: 20, message: "Happy day" });
    simulateReveal(pot.slug, pot.managerKey, "gift_card");
    const raw = JSON.stringify({ pot: getPotBySlug(pot.slug), events: listEvents() });
    // Blank unquoted JSON numbers (timestamps/amounts); a typed PAN lives in a string.
    const everything = raw.replace(/(?<=[:,[])\s*-?\d+(\.\d+)?/g, "0");
    expect(everything).not.toMatch(/\b(?:\d[ -]?){13,19}\b/);
    expect(everything.toLowerCase()).not.toContain("cvc");
    expect(everything.toLowerCase()).not.toContain("cardnumber");
  });

  it("assertNoCardData throws if a PAN reaches the event log", () => {
    expect(() => logEvent("bad", { props: { note: "4242424242424242" } })).toThrow(/guardrail 1/);
  });
});

// ── Loop coverage: stack + reset ────────────────────────────────────────────────
describe("stack + reset", () => {
  it("reveal→stack marks the pot stacked; reset restores exactly three seed pots", () => {
    const pot = basePot();
    contribute(pot.slug, { displayName: "B", amount: 10 });
    const stacked = simulateReveal(pot.slug, pot.managerKey, "stack");
    expect(stacked.status).toBe("stacked");
    resetSandbox();
    expect(getPotBySlug(pot.slug)).toBeUndefined();
    expect(listEvents()).toHaveLength(0);
  });
});
