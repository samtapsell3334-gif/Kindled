import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createPot, getPotBySlug, resetSandbox } from "../sandbox/store";
import { questionSequence, QUESTIONS } from "../../content/survey";

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

describe("survey branching (v11 WS-14)", () => {
  it("whip-round follow-up appears only after Yes", () => {
    expect(questionSequence({}, "buyer").some((q) => q.id === "q8b_worst_bit")).toBe(false);
    expect(questionSequence({ q8_whipround: "Yes" }, "buyer").some((q) => q.id === "q8b_worst_bit")).toBe(true);
  });
  it("the child WYR shows only to parents", () => {
    expect(questionSequence({}, "buyer").some((q) => q.id === "q10_wyr_child")).toBe(false);
    expect(questionSequence({}, "parent").some((q) => q.id === "q10_wyr_child")).toBe(true);
    expect(questionSequence({}, "both").some((q) => q.id === "q10_wyr_child")).toBe(true);
  });
  it("the objection question is present (research integrity)", () => {
    expect(QUESTIONS.some((q) => q.id === "q15_objection")).toBe(true);
  });
});

describe("v11.3 survey addendum — curated-list concept test (parent/both branch)", () => {
  it("New screens A and B appear ONLY for parent/both, never for buyer", () => {
    for (const seg of ["parent", "both"]) {
      const seq = questionSequence({}, seg);
      expect(seq.some((q) => q.id === "duplicate_pain_experienced"), seg).toBe(true);
      expect(seq.some((q) => q.id === "curated_list_appeal"), seg).toBe(true);
    }
    const buyerSeq = questionSequence({}, "buyer");
    expect(buyerSeq.some((q) => q.id === "duplicate_pain_experienced")).toBe(false);
    expect(buyerSeq.some((q) => q.id === "curated_list_appeal")).toBe(false);
  });

  it("both new screens sit immediately after q7_landed and before q8_whipround", () => {
    const seq = questionSequence({}, "both").map((q) => q.id);
    const iLanded = seq.indexOf("q7_landed");
    const iPain = seq.indexOf("duplicate_pain_experienced");
    const iAppeal = seq.indexOf("curated_list_appeal");
    const iWhip = seq.indexOf("q8_whipround");
    expect(iLanded).toBeGreaterThanOrEqual(0);
    expect(iPain).toBe(iLanded + 1);
    expect(iAppeal).toBe(iPain + 1);
    expect(iWhip).toBe(iAppeal + 1);
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

  it("the appeal question (q14) was widened to all nine Patch 3 options", () => {
    const q = QUESTIONS.find((x) => x.id === "q14_appeal");
    expect(q?.kind).toBe("multi");
    if (q?.kind === "multi") {
      expect(q.options).toHaveLength(9);
      for (const added of ["No duplicate gifts", "Buyers know exactly what to get", "Being able to add a surprise contribution on the day"]) {
        expect(q.options).toContain(added);
      }
    }
  });

  it("the concept paragraph (Patch 2) no longer narrows to a single pooled pot", () => {
    const q = QUESTIONS.find((x) => x.id === "q13_concept");
    expect(q?.kind).toBe("single");
    if (q?.kind === "single") {
      expect(q.concept).toMatch(/specific things|surprise on the big day/i);
    }
  });
});
