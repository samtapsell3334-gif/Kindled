import { describe, it, expect } from "vitest";
import {
  STAR_COUNT, calculateStarValue, createChart, setGoalValue,
  awardBehavior, awardStars, isGoalUnlocked, starProgress, type Behavior,
} from "@/lib/star-engine";

/**
 * Star-engine unit tests (amounts + the 30-star ceiling — a status-ish transition).
 * PotValue must always equal starsFilled × starValue, and must never exceed the goal.
 */
const behavior = (starsAwarded: number, id = "b"): Behavior => ({
  id, description: "Test behaviour", starsAwarded, isRecurring: false,
});

describe("calculateStarValue", () => {
  it("divides the goal into 30 stars", () => {
    expect(calculateStarValue(300)).toBe(10);
    expect(calculateStarValue(300, STAR_COUNT)).toBe(10);
  });
  it("guards against zero / negative goals", () => {
    expect(calculateStarValue(0)).toBe(0);
    expect(calculateStarValue(-50)).toBe(0);
    expect(calculateStarValue(100, 0)).toBe(0);
  });
  it("rounds to pennies", () => {
    expect(calculateStarValue(100)).toBeCloseTo(3.33, 2);
  });
});

describe("createChart", () => {
  it("derives potValue from seeded stars", () => {
    const c = createChart(300, 3);
    expect(c.starsFilled).toBe(3);
    expect(c.potValue).toBe(30);
  });
  it("clamps seeded stars into 0..30", () => {
    expect(createChart(300, 99).starsFilled).toBe(30);
    expect(createChart(300, -5).starsFilled).toBe(0);
  });
});

describe("awardBehavior", () => {
  it("fills stars, re-derives potValue and appends an audit entry", () => {
    const c = awardBehavior(createChart(300), behavior(2));
    expect(c.starsFilled).toBe(2);
    expect(c.potValue).toBe(20);
    expect(c.auditLog).toHaveLength(1);
    expect(c.auditLog[0]?.valueAdded).toBe(20);
    expect(c.auditLog[0]?.starIndexStart).toBe(0);
  });

  it("clamps to the 30-star ceiling and never over-fills PotValue", () => {
    const near = createChart(300, 29);
    const c = awardBehavior(near, behavior(5));
    expect(c.starsFilled).toBe(STAR_COUNT);
    expect(c.potValue).toBe(300);
    expect(c.auditLog[0]?.starsAwarded).toBe(1); // only the last slot was fillable
  });

  it("is a no-op once the chart is full (returns the same reference)", () => {
    const full = createChart(300, 30);
    expect(awardBehavior(full, behavior(1))).toBe(full);
  });

  it("ignores non-positive awards", () => {
    const c = createChart(300, 5);
    expect(awardBehavior(c, behavior(0))).toBe(c);
    expect(awardBehavior(c, behavior(-3))).toBe(c);
  });
});

describe("setGoalValue", () => {
  it("re-derives potValue from the existing star count", () => {
    const c = setGoalValue(createChart(300, 6), 600);
    expect(c.starsFilled).toBe(6);
    expect(c.potValue).toBe(120); // 6 × (600/30)
  });
});

describe("progress helpers", () => {
  it("reports unlock and progress", () => {
    expect(isGoalUnlocked(createChart(300, 30))).toBe(true);
    expect(isGoalUnlocked(createChart(300, 29))).toBe(false);
    expect(starProgress(createChart(300, 15))).toBeCloseTo(0.5, 5);
    expect(starProgress(createChart(300, 45))).toBe(1);
  });
  it("awardStars is a thin wrapper over awardBehavior", () => {
    expect(awardStars(createChart(300), 4).starsFilled).toBe(4);
  });
});
