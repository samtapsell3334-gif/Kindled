import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createPot, getPotBySlug, resetSandbox } from "../sandbox/store";
import { questionSequence, QUESTIONS, computeGiftProjection, tierFor, bandMidpoint, TIER_EXAMPLES } from "../../content/survey";

/**
 * v11 WS-13 acceptance: the sandbox admin reset must NEVER touch the waitlist
 * or survey tables. Structural guarantee: the reset operates only on the
 * in-memory sandbox Db and the sandbox_state JSONB mirror — the store module
 * contains no reference to the durable research tables, and behaviourally a
 * reset only clears sandbox pots.
 */
describe("waitlist + survey survive the sandbox reset", () => {
  it("resetSandbox clears sandbox pots only (behavioural)", () => {
    const pot = createPot({
      title: "Reset check", recipientName: "Ava", occasion: "Birthday",
      eventDate: "2026-08-14", isSurprise: false, isChildPot: false,
      starChartEnabled: false, organiserName: "Sam", items: [],
    });
    expect(getPotBySlug(pot.slug)).toBeDefined();
    resetSandbox();
    expect(getPotBySlug(pot.slug)).toBeUndefined();
  });

  it("the sandbox store never references the waitlist or survey tables (structural)", () => {
    const store = readFileSync("src/lib/sandbox/store.ts", "utf-8");
    expect(store).not.toMatch(/waitlistSignup|surveyResponse|WaitlistSignup|SurveyResponse/);
    // its only durable write target is the sandbox_state singleton
    expect(store).toMatch(/sandboxState/);
  });
});

describe("survey sequence (v14: unbranched)", () => {
  it("every segment gets the exact same question sequence — no decision tree", () => {
    const parent = questionSequence({}).map((q) => q.id);
    const buyer = questionSequence({}).map((q) => q.id);
    const both = questionSequence({}).map((q) => q.id);
    const neither = questionSequence({}).map((q) => q.id);
    // questionSequence no longer takes a segment at all — this is the point:
    // there is exactly one sequence, not one per segment.
    expect(parent).toEqual(buyer);
    expect(buyer).toEqual(both);
    expect(both).toEqual(neither);
  });

  it("whipround worst-bit is the one remaining skip — answer-driven, not identity-driven", () => {
    expect(questionSequence({}).some((q) => q.id === "whipround_worst_bit")).toBe(true);
    expect(questionSequence({ group_gift_method: "We don't really do group gifts" }).some((q) => q.id === "whipround_worst_bit")).toBe(false);
    expect(questionSequence({ group_gift_method: "Cash in a card" }).some((q) => q.id === "whipround_worst_bit")).toBe(true);
  });

  it("the kids WYR (Q7) is asked of everyone — no longer parent-gated", () => {
    expect(questionSequence({}).some((q) => q.id === "wyr_kids_choice")).toBe(true);
    expect(QUESTIONS.find((q) => q.id === "wyr_kids_choice")).not.toHaveProperty("parentsOnly");
  });

  it("Q9a/Q9b (duplicate pain + curated-list) are asked of everyone — no longer parent-gated", () => {
    const seq = questionSequence({});
    expect(seq.some((q) => q.id === "duplicate_pain_experienced")).toBe(true);
    expect(seq.some((q) => q.id === "curated_list_appeal")).toBe(true);
    expect(QUESTIONS.find((q) => q.id === "duplicate_pain_experienced")).not.toHaveProperty("parentsOnly");
    expect(QUESTIONS.find((q) => q.id === "curated_list_appeal")).not.toHaveProperty("parentsOnly");
  });

  it("Q9a/Q9b sit immediately after asked_frequency (Q9) and before buy_behaviour (Q10)", () => {
    const seq = questionSequence({}).map((q) => q.id);
    const iAsked = seq.indexOf("asked_frequency");
    const iPain = seq.indexOf("duplicate_pain_experienced");
    const iAppeal = seq.indexOf("curated_list_appeal");
    const iBuy = seq.indexOf("buy_behaviour");
    expect(iAsked).toBeGreaterThanOrEqual(0);
    expect(iPain).toBe(iAsked + 1);
    expect(iAppeal).toBe(iPain + 1);
    expect(iBuy).toBe(iAppeal + 1);
  });

  it("the objection question is present (research integrity)", () => {
    expect(QUESTIONS.some((q) => q.id === "objection")).toBe(true);
  });

  it("the appeal question has all nine options", () => {
    const q = QUESTIONS.find((x) => x.id === "appeal");
    expect(q?.kind).toBe("multi");
    if (q?.kind === "multi") {
      expect(q.options).toHaveLength(9);
      for (const added of ["No duplicate gifts", "Buyers know exactly what to get", "Being able to add a surprise contribution on the day"]) {
        expect(q.options).toContain(added);
      }
    }
  });

  it("the concept paragraph (Q16) doesn't narrow to a single pooled pot", () => {
    const q = QUESTIONS.find((x) => x.id === "concept_intent");
    expect(q?.kind).toBe("single");
    if (q?.kind === "single") {
      expect(q.concept).toMatch(/specific things|surprise on the big day/i);
    }
  });

  it("duplicate_pain_experienced is a multi-select with the five specified options", () => {
    const q = QUESTIONS.find((x) => x.id === "duplicate_pain_experienced");
    expect(q?.kind).toBe("multi");
    if (q?.kind === "multi") {
      expect(q.options).toHaveLength(5);
      expect(q.options).toContain("None of these");
    }
  });

  it("curated_list_appeal carries its own concept paragraph and four appeal levels", () => {
    const q = QUESTIONS.find((x) => x.id === "curated_list_appeal");
    expect(q?.kind).toBe("single");
    if (q?.kind === "single") {
      expect(q.concept).toBeTruthy();
      expect(q.options).toEqual(["Extremely appealing", "Quite appealing", "Not that appealing", "Not for me"]);
    }
  });

  it("the two numeric steppers (Q2/Q3) have the specified range and starting values", () => {
    const outgoing = QUESTIONS.find((x) => x.id === "people_bought_for");
    const incoming = QUESTIONS.find((x) => x.id === "people_buying_for_you");
    expect(outgoing?.kind).toBe("stepper");
    expect(incoming?.kind).toBe("stepper");
    if (outgoing?.kind === "stepper") { expect(outgoing.min).toBe(0); expect(outgoing.max).toBe(30); expect(outgoing.start).toBe(8); expect(outgoing.topLabel).toBe("30+"); }
    if (incoming?.kind === "stepper") { expect(incoming.min).toBe(0); expect(incoming.max).toBe(30); expect(incoming.start).toBe(6); expect(incoming.topLabel).toBe("30+"); }
  });

  it("the two banded value questions (Q4/Q5) share identical bands/midpoints", () => {
    const bday = QUESTIONS.find((x) => x.id === "bday_value_band");
    const xmas = QUESTIONS.find((x) => x.id === "xmas_value_band");
    expect(bday?.kind).toBe("banded");
    expect(xmas?.kind).toBe("banded");
    if (bday?.kind === "banded" && xmas?.kind === "banded") {
      expect(bday.options).toEqual(xmas.options);
      expect(bday.options.map((o) => o.mid)).toEqual([25, 75, 150, 300, 500]);
    }
  });

  it("Q6 (wyr_2yr_choice) is a plain WYR with no numbers shown mid-survey", () => {
    const q = QUESTIONS.find((x) => x.id === "wyr_2yr_choice");
    expect(q?.kind).toBe("wyr");
    if (q?.kind === "wyr") {
      expect(q.a).not.toMatch(/£|\d/);
      expect(q.b).not.toMatch(/£|\d/);
    }
    expect(questionSequence({}).some((q) => q.id === "wyr_2yr_choice")).toBe(true);
  });

  it("Q7 (wyr_kids_choice) frames option A as uncoordinated separate buying, B as pooled", () => {
    const q = QUESTIONS.find((x) => x.id === "wyr_kids_choice");
    expect(q?.kind).toBe("wyr");
    if (q?.kind === "wyr") {
      expect(q.a).toMatch(/left to choose on their own/i);
      expect(q.b).toMatch(/contributing to that one big/i);
    }
  });
});

describe("gift projection engine (v14: 1-year + 2-year, 3 examples per tier)", () => {
  it("computes one- and two-year gifts/value from Q3/Q4/Q5 answers", () => {
    const p = computeGiftProjection({ people_buying_for_you: 6, bday_value_band: "£50–£100", xmas_value_band: "£100–£200" });
    expect(p).not.toBeNull();
    expect(p?.oneYearGifts).toBe(6);
    expect(p?.oneYearValue).toBe(225); // 75 + 150
    expect(p?.twoYearGifts).toBe(12); // 6 * 2
    expect(p?.twoYearValue).toBe(450); // (75 + 150) * 2
  });

  it("one-year figures are always exactly half the two-year figures", () => {
    const p = computeGiftProjection({ people_buying_for_you: 9, bday_value_band: "£200–£400", xmas_value_band: "£400+" })!;
    expect(p.oneYearGifts * 2).toBe(p.twoYearGifts);
    expect(p.oneYearValue * 2).toBe(p.twoYearValue);
  });

  it("every tier has exactly three discrete examples", () => {
    for (const tier of ["low", "mid", "high", "top"] as const) {
      expect(TIER_EXAMPLES[tier]).toHaveLength(3);
      for (const example of TIER_EXAMPLES[tier]) expect(typeof example).toBe("string");
    }
  });

  it("returns null when the inputs aren't all answered yet", () => {
    expect(computeGiftProjection({})).toBeNull();
    expect(computeGiftProjection({ people_buying_for_you: 6 })).toBeNull();
  });

  it("bandMidpoint maps every band label to its documented midpoint", () => {
    expect(bandMidpoint("Under £50")).toBe(25);
    expect(bandMidpoint("£50–£100")).toBe(75);
    expect(bandMidpoint("£100–£200")).toBe(150);
    expect(bandMidpoint("£200–£400")).toBe(300);
    expect(bandMidpoint("£400+")).toBe(500);
    expect(bandMidpoint("not a band")).toBe(0);
  });

  it("tier boundaries match the brief across all four tiers", () => {
    expect(tierFor(0)).toBe("low");
    expect(tierFor(299)).toBe("low");
    expect(tierFor(300)).toBe("mid");
    expect(tierFor(799)).toBe("mid");
    expect(tierFor(800)).toBe("high");
    expect(tierFor(1499)).toBe("high");
    expect(tierFor(1500)).toBe("top");
    expect(tierFor(5000)).toBe("top");
  });

  it("three profiles spanning all four tiers produce correct figures and tier examples", () => {
    // Low tier: small household, modest bands.
    const low = computeGiftProjection({ people_buying_for_you: 2, bday_value_band: "Under £50", xmas_value_band: "Under £50" })!;
    expect(low.tier).toBe("low");
    expect(low.twoYearGifts).toBe(4);
    expect(low.twoYearValue).toBe(100);
    expect(TIER_EXAMPLES[low.tier]).toContain("a great pair of trainers or headphones");

    // High tier: larger family, generous bands.
    const high = computeGiftProjection({ people_buying_for_you: 8, bday_value_band: "£200–£400", xmas_value_band: "£200–£400" })!;
    expect(high.tier).toBe("high");
    expect(TIER_EXAMPLES[high.tier]).toContain("a hot tub");

    // Top tier: big extended family, top bands.
    const top = computeGiftProjection({ people_buying_for_you: 15, bday_value_band: "£400+", xmas_value_band: "£400+" })!;
    expect(top.tier).toBe("top");
    expect(top.twoYearGifts).toBe(30);
    expect(TIER_EXAMPLES[top.tier]).toContain("a villa holiday");

    // Mid tier, for completeness across all four.
    const mid = computeGiftProjection({ people_buying_for_you: 4, bday_value_band: "£100–£200", xmas_value_band: "£100–£200" })!;
    expect(mid.tier).toBe("mid");
    expect(TIER_EXAMPLES[mid.tier]).toContain("a new sofa");
  });
});
