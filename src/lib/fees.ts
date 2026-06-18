import { Decimal } from "@prisma/client/runtime/library";

// All monetary constants in minor units expressed as Decimal to avoid float drift
const PROCESSING_COST = new Decimal("0.05"); // flat 5p A2A pass-through
const PLATFORM_FEE_RATE = new Decimal("0.005"); // 0.5% of gross

export interface FeeBreakdown {
  gross: Decimal;
  platformFee: Decimal;
  processingCost: Decimal;
  netToPot: Decimal;
}

/**
 * Calculates the exact fee breakdown for an Open Banking contribution.
 *
 * Rounding rule: ROUND_HALF_UP on each component independently so that
 * platformFee + processingCost + netToPot === gross always holds.
 */
export function calculateFees(grossAmount: Decimal): FeeBreakdown {
  const platformFee = grossAmount.mul(PLATFORM_FEE_RATE).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const processingCost = PROCESSING_COST;
  const netToPot = grossAmount.sub(platformFee).sub(processingCost);

  if (netToPot.lessThanOrEqualTo(0)) {
    throw new Error("Contribution amount is too small to cover processing costs.");
  }

  return { gross: grossAmount, platformFee, processingCost, netToPot };
}
