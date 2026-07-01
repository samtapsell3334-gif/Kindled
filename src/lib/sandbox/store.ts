/**
 * Sandbox store (v4.1 WS-A) — the persistence adapter.
 *
 * When DATABASE_URL exists the intended backend is Prisma/Postgres (models to be
 * wired when the founder provisions a database — TODO-FOUNDER). Until then, a
 * process-global in-memory store keeps the entire loop working locally and on a
 * single long-lived server. Limitation (logged in PLAN.md): on serverless the
 * fallback does not survive cold starts — cross-device guarantees need the DB.
 *
 * GUARDRAIL 1 ENFORCEMENT: `stripCardData` removes any card-like keys from every
 * inbound payload before it can reach the store or the event log, and
 * `assertNoCardData` throws in dev/tests if one slips through. Unit-tested.
 */

import type {
  SandboxPot, SandboxItem, SandboxContribution, SandboxMessage, SandboxEvent,
  RevealOutcome,
} from "./types";

// ─── id + slug helpers ──────────────────────────────────────────────────────────

const rand = (len = 10) =>
  Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map((b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31])
    .join("");

export const newId = (prefix: string) => `${prefix}_${rand(8)}`;
export const newSlug = () => rand(10);
export const newManagerKey = () => rand(16);

// ─── card-data guard (guardrail 1) ──────────────────────────────────────────────

const CARD_KEY_RE = /card|pan\b|cvc|cvv|expiry|exp_|cardnumber|securitycode/i;
const PAN_VALUE_RE = /\b(?:\d[ -]?){13,19}\b/;

/** Strip any card-like keys and any PAN-looking string values from a payload. */
export function stripCardData<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (CARD_KEY_RE.test(k)) continue;
    if (typeof v === "string" && PAN_VALUE_RE.test(v)) continue;
    clean[k] = v;
  }
  return clean as Partial<T>;
}

/** Dev/test assertion that a record about to be persisted carries no card data. */
export function assertNoCardData(record: unknown): void {
  const s = JSON.stringify(record) ?? "";
  // Card-like KEYS are checked against keys only (values like "gift_card" are fine).
  const keys = [...s.matchAll(/"([^"]+)"\s*:/g)].map((m) => m[1] ?? "");
  const badKey = keys.some((k) => CARD_KEY_RE.test(k));
  // Blank out unquoted JSON numbers (timestamps, amounts) — a typed PAN always
  // arrives inside a string value, which is what we scan.
  const stringsOnly = s.replace(/(?<=[:,[])\s*-?\d+(\.\d+)?/g, "0");
  if (badKey || PAN_VALUE_RE.test(stringsOnly)) {
    throw new Error("Card-like data reached the sandbox store — guardrail 1 violation.");
  }
}

// ─── in-memory backing (global so dev HMR / route modules share state) ──────────

interface Db {
  pots: Map<string, SandboxPot>;
  events: SandboxEvent[];
}

const g = globalThis as unknown as { __kindledSandbox?: Db };
function db(): Db {
  if (!g.__kindledSandbox) {
    g.__kindledSandbox = { pots: new Map(), events: [] };
    seed(g.__kindledSandbox);
  }
  return g.__kindledSandbox;
}

// ─── events (WS-G — append-only) ────────────────────────────────────────────────

export function logEvent(
  event: string,
  fields: { potId?: string; ref?: string; props?: Record<string, string | number | boolean> } = {},
): SandboxEvent {
  const e: SandboxEvent = {
    id: newId("evt"),
    event,
    ...(fields.potId ? { potId: fields.potId } : {}),
    ...(fields.ref ? { ref: fields.ref } : {}),
    ...(fields.props ? { props: fields.props } : {}),
    ts: Date.now(),
  };
  assertNoCardData(e);
  const evts = db().events;
  if (evts.length >= MAX_EVENTS) evts.splice(0, 1000); // trim oldest — sandbox only
  evts.push(e);
  return e;
}

export function listEvents(): SandboxEvent[] {
  return [...db().events];
}

// ─── pot CRUD ───────────────────────────────────────────────────────────────────

export interface CreatePotInput {
  title: string;
  recipientName: string;
  occasion: string;
  eventDate: string;
  isSurprise: boolean;
  isChildPot: boolean;
  starChartEnabled: boolean;
  organiserName: string;
  organiserEmail?: string;
  items: Omit<SandboxItem, "id" | "approved">[];
  ref?: string;
  stackedFrom?: string;
  seeded?: boolean;
}

const MAX_POTS = 300;
const MAX_CONTRIBUTIONS_PER_POT = 200;
const MAX_EVENTS = 10_000;

export function createPot(input: CreatePotInput): SandboxPot {
  if (db().pots.size >= MAX_POTS) throw new Error("Sandbox is full — try after the next reset.");
  const pot: SandboxPot = {
    id: newId("spot"),
    slug: newSlug(),
    managerKey: newManagerKey(),
    title: input.title,
    recipientName: input.recipientName,
    occasion: input.occasion,
    eventDate: input.eventDate,
    isSurprise: input.isSurprise,
    isChildPot: input.isChildPot,
    starChartEnabled: input.starChartEnabled && input.isChildPot,
    organiserName: input.organiserName,
    ...(input.organiserEmail ? { organiserEmail: input.organiserEmail } : {}),
    status: "open",
    ...(input.stackedFrom ? { stackedFrom: input.stackedFrom } : {}),
    items: input.items.map((it) => ({
      ...it,
      id: newId("item"),
      // Child-circled items await parent approval (guardrail 5); others are live.
      approved: it.source !== "kid_circled",
    })),
    contributions: [],
    messages: [],
    createdAt: Date.now(),
    ...(input.seeded ? { seeded: true } : {}),
  };
  assertNoCardData(pot);
  db().pots.set(pot.id, pot);
  logEvent("pot_created", {
    potId: pot.id,
    ...(input.ref ? { ref: input.ref } : {}),
    props: { is_child: pot.isChildPot, star_chart: pot.starChartEnabled, surprise: pot.isSurprise, items: pot.items.length },
  });
  for (const it of pot.items) {
    logEvent("item_added", { potId: pot.id, props: { category: it.category, retailer: it.retailer, price_band: it.priceBand, source: it.source } });
  }
  return pot;
}

export function getPotBySlug(slug: string): SandboxPot | undefined {
  return [...db().pots.values()].find((p) => p.slug === slug);
}

export function getPotById(id: string): SandboxPot | undefined {
  return db().pots.get(id);
}

// ─── contribute (simulated money) ───────────────────────────────────────────────

export function contribute(
  slug: string,
  input: { displayName: string; amount: number; message?: string; videoRef?: string; consent?: boolean; ref?: string },
): { pot: SandboxPot; contribution: SandboxContribution } {
  const pot = getPotBySlug(slug);
  if (!pot) throw new Error("Pot not found");
  if (pot.status !== "open") throw new Error("Pot is not open");
  if (pot.contributions.length >= MAX_CONTRIBUTIONS_PER_POT) throw new Error("This pot has reached the sandbox contribution cap.");
  const amount = Math.max(1, Math.min(500, Math.round(input.amount)));
  const contribution: SandboxContribution = {
    id: newId("con"),
    potId: pot.id,
    displayName: input.displayName.slice(0, 40) || "Someone",
    amount,
    ...(input.ref ? { ref: input.ref } : {}),
    createdAt: Date.now(),
  };
  assertNoCardData(contribution);
  pot.contributions.push(contribution);
  logEvent("contribution_completed", { potId: pot.id, ...(input.ref ? { ref: input.ref } : {}), props: { amount } });

  if (input.message || input.videoRef) {
    const msg: SandboxMessage = {
      id: newId("msg"),
      contributionId: contribution.id,
      displayName: contribution.displayName,
      ...(input.message ? { text: input.message.slice(0, 500) } : {}),
      ...(input.videoRef ? { videoRef: input.videoRef } : {}),
      consent: input.consent ?? false,
      createdAt: Date.now(),
    };
    assertNoCardData(msg);
    pot.messages.push(msg);
    logEvent("message_added", { potId: pot.id, props: { type: input.videoRef ? "video" : "text" } });
  }
  return { pot, contribution };
}

// ─── reveal + outcomes (WS-E minimal) ───────────────────────────────────────────

const SIMULATED_COMMISSION_PCT = Number(process.env.SANDBOX_COMMISSION_PCT ?? "5");

export function simulateReveal(
  slug: string,
  managerKey: string,
  outcome: RevealOutcome,
  opts: { retailer?: string } = {},
): SandboxPot {
  const pot = getPotBySlug(slug);
  if (!pot || pot.managerKey !== managerKey) throw new Error("Not authorised");
  const raised = pot.contributions.reduce((a, c) => a + c.amount, 0);
  pot.status = outcome === "stack" ? "stacked" : "revealed";
  pot.revealOutcome = outcome;
  logEvent("reveal_triggered", { potId: pot.id, props: { raised } });
  if (outcome === "gift_card") {
    pot.simulatedCommission = Math.round(raised * SIMULATED_COMMISSION_PCT) / 100;
    logEvent("reveal_outcome", {
      potId: pot.id,
      props: { outcome, retailer: opts.retailer ?? "unspecified", simulated_commission: pot.simulatedCommission },
    });
  } else {
    logEvent("reveal_outcome", { potId: pot.id, props: { outcome, ...(opts.retailer ? { retailer: opts.retailer } : {}) } });
  }
  return pot;
}

// ─── seed + reset (WS-A) ────────────────────────────────────────────────────────

function seedPot(d: Db, pot: SandboxPot) {
  d.pots.set(pot.id, pot);
}

function seed(d: Db): void {
  const mk = (over: Partial<SandboxPot> & { title: string; recipientName: string; occasion: string }): SandboxPot => ({
    id: newId("spot"), slug: newSlug(), managerKey: newManagerKey(),
    eventDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    isSurprise: true, isChildPot: false, starChartEnabled: false,
    organiserName: "Seed", status: "open", items: [], contributions: [], messages: [],
    createdAt: Date.now(), seeded: true, ...over,
  });
  const item = (name: string, price: number, category: string, retailer: string): SandboxItem => ({
    id: newId("item"), name, price, category, retailer,
    priceBand: price < 25 ? "under25" : price <= 100 ? "25to100" : price <= 500 ? "100to500" : "over500",
    source: "catalogue", approved: true,
  });

  seedPot(d, mk({
    title: "Ava's 8th Birthday", recipientName: "Ava", occasion: "Birthday",
    isChildPot: true, starChartEnabled: true, organiserName: "Mum",
    items: [item("LEGO Friends Treehouse", 65, "Toys", "Smyths"), item("Roller skates", 45, "Sports", "Decathlon"), item("Art supplies set", 22, "Craft", "Hobbycraft")],
    contributions: [
      { id: newId("con"), potId: "seeded", displayName: "Grandma Jean", amount: 30, createdAt: Date.now() - 4 * 86_400_000 },
      { id: newId("con"), potId: "seeded", displayName: "Uncle Pete", amount: 20, createdAt: Date.now() - 2 * 86_400_000 },
    ],
  }));
  seedPot(d, mk({
    title: "The Log Burner Fund", recipientName: "Sam & Jess", occasion: "Joint goal",
    isSurprise: false, organiserName: "Sam",
    items: [item("Charnwood log burner", 799, "Home", "Charnwood")],
    contributions: [{ id: newId("con"), potId: "seeded", displayName: "Sam", amount: 120, createdAt: Date.now() - 6 * 86_400_000 }],
  }));
  seedPot(d, mk({
    title: "Priya's Leaving Gift", recipientName: "Priya", occasion: "Leaving do",
    organiserName: "The team",
    items: [item("Weekend spa voucher", 150, "Experiences", "Virgin Experience Days"), item("Fountain pen", 40, "Stationery", "John Lewis")],
  }));
}

/** Admin reset — wipe everything and restore the three seed pots exactly. */
export function resetSandbox(): void {
  const d = db();
  d.pots.clear();
  d.events = [];
  seed(d);
}
