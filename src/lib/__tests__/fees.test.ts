import { describe, it, expect } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { calculateFees } from "@/lib/fees";

/**
 * Financial unit tests (required by CLAUDE.md). The core invariant is that the
 * three fee components always sum back to the gross, with ROUND_HALF_UP applied
 * to the platform fee independently.
 */
describe("calculateFees", () => {
  it("applies 0.5% platform fee and a flat 5p processing cost", () => {
    const b = calculateFees(new Decimal("100"));
    expect(b.platformFee.toString()).toBe("0.5");
    expect(b.processingCost.toString()).toBe("0.05");
    expect(b.netToPot.toString()).toBe("99.45");
  });

  it("keeps components summing exactly to gross", () => {
    for (const g of ["1", "10.01", "23.99", "100", "250.5", "999.99"]) {
      const gross = new Decimal(g);
      const b = calculateFees(gross);
      const sum = b.platformFee.add(b.processingCost).add(b.netToPot);
      expect(sum.equals(gross)).toBe(true);
      expect(b.gross.equals(gross)).toBe(true);
    }
  });

  it("rounds the platform fee HALF_UP (0.005 → 0.01, not banker's 0.00)", () => {
    const b = calculateFees(new Decimal("1"));
    expect(b.platformFee.toString()).toBe("0.01");
    // 1 − 0.01 − 0.05 = 0.94, and the components still reconstitute gross.
    expect(b.netToPot.toString()).toBe("0.94");
    expect(b.platformFee.add(b.processingCost).add(b.netToPot).toString()).toBe("1");
  });

  it("throws when the amount cannot cover processing costs", () => {
    expect(() => calculateFees(new Decimal("0.05"))).toThrow(/too small/i);
    expect(() => calculateFees(new Decimal("0.04"))).toThrow();
  });

  it("returns Decimal values, never floats", () => {
    const b = calculateFees(new Decimal("42.42"));
    expect(b.platformFee).toBeInstanceOf(Decimal);
    expect(b.netToPot).toBeInstanceOf(Decimal);
  });
});
