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
