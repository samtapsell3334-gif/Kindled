import { describe, it, expect } from "vitest";
import { splitCommission, USER_CASHBACK_SHARE } from "@/lib/catalog-service";

/**
 * Commission-split unit tests — the cashback math powering CompletionValue's
 * "3% back" viral prompt. On a 5% commission the user keeps 3%, the platform 2%.
 */
describe("splitCommission", () => {
  it("gives the user 60% of the commission as cashback", () => {
    expect(USER_CASHBACK_SHARE).toBe(0.6);
    const s = splitCommission(5);
    expect(s.total).toBe(5);
    expect(s.userBonus).toBe(3);
    expect(s.platformProfit).toBe(2);
  });

  it("always reconstitutes the total (userBonus + platformProfit === total)", () => {
    for (const rate of [1, 2.5, 4, 7.3, 10]) {
      const s = splitCommission(rate);
      expect(s.userBonus + s.platformProfit).toBeCloseTo(rate, 2);
      expect(s.userBonus).toBeCloseTo(rate * 0.6, 2);
    }
  });

  it("reads the rate off a retailer object", () => {
    const s = splitCommission({ commission_rate: 8 } as unknown as Parameters<typeof splitCommission>[0]);
    expect(s.total).toBe(8);
    expect(s.userBonus).toBe(4.8);
  });
});
