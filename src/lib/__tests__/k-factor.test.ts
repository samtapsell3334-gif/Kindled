import { describe, it, expect } from "vitest";
import { computeKFactor, kFactorCards, pct, type FunnelInputs } from "@/lib/k-factor";

/**
 * K-factor unit tests — the viral-loop metric math behind /admin/k-factor.
 */
const inputs = (over: Partial<FunnelInputs> = {}): FunnelInputs => ({
  visitors: 1000, signups: 300, potsCreated: 100, shares: 500,
  contributors: 400, contributorsWhoStarted: 120, ...over,
});

describe("computeKFactor", () => {
  it("computes the three ratios and K = velocity × conversion", () => {
    const r = computeKFactor(inputs());
    expect(r.conversionRate).toBe(0.3); // 300 / 1000
    expect(r.referralVelocity).toBe(5); // 500 / 100
    expect(r.contributionToStartRatio).toBe(0.3); // 120 / 400
    expect(r.kFactor).toBe(1.5); // 5 × 0.3
    expect(r.viral).toBe(true);
  });

  it("flags below-threshold loops as non-viral", () => {
    const r = computeKFactor(inputs({ shares: 100 })); // velocity 1 × conv 0.3 = 0.3
    expect(r.kFactor).toBe(0.3);
    expect(r.viral).toBe(false);
  });

  it("never divides by zero", () => {
    const r = computeKFactor({ visitors: 0, signups: 5, potsCreated: 0, shares: 9, contributors: 0, contributorsWhoStarted: 3 });
    expect(r.conversionRate).toBe(0);
    expect(r.referralVelocity).toBe(0);
    expect(r.contributionToStartRatio).toBe(0);
    expect(r.kFactor).toBe(0);
    expect(r.viral).toBe(false);
  });

  it("K = 1 is not yet self-sustaining (strict >)", () => {
    const r = computeKFactor({ visitors: 100, signups: 50, potsCreated: 10, shares: 20, contributors: 1, contributorsWhoStarted: 0 });
    // velocity 2 × conversion 0.5 = 1.0
    expect(r.kFactor).toBe(1);
    expect(r.viral).toBe(false);
  });
});

describe("presentation helpers", () => {
  it("pct renders a ratio as a percentage", () => {
    expect(pct(0.3)).toBe("30%");
    expect(pct(0.125)).toBe("12.5%");
  });
  it("kFactorCards returns four cards in display order", () => {
    const cards = kFactorCards(computeKFactor(inputs()));
    expect(cards.map((c) => c.label)).toEqual([
      "Conversion Rate", "Referral Velocity", "Contribution → Start", "K-Factor",
    ]);
    expect(cards[3]?.value).toBe("1.50");
  });
});
