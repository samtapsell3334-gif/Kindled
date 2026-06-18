import type { Decimal } from "@prisma/client/runtime/library";
import type { PotStatus } from "@prisma/client";

export type TransitionEvent = "BRIDGE_THE_GAP" | "IGNITE_REVEAL" | null;

interface PotSnapshot {
  targetAmount: Decimal;
  previousBalance: Decimal;
  newBalance: Decimal;
  currentStatus: PotStatus;
}

interface TransitionResult {
  nextStatus: PotStatus;
  event: TransitionEvent;
}

/**
 * Pure function — determines the next pot status and any milestone event
 * triggered by a balance update. Uses exact Decimal comparisons.
 *
 * Status progression: ACTIVE → HALFWAY → FUNDED (STALLED is set by background job).
 * A pot can never regress from FUNDED, and a webhook cannot set STALLED.
 */
export function resolveTransition(snapshot: PotSnapshot): TransitionResult {
  const { targetAmount, previousBalance, newBalance, currentStatus } = snapshot;

  if (currentStatus === "FUNDED") {
    return { nextStatus: "FUNDED", event: null };
  }

  const halfwayThreshold = targetAmount.mul("0.5");
  const crossedHalfway = previousBalance.lessThan(halfwayThreshold) && newBalance.gte(halfwayThreshold);
  const crossedFunded = newBalance.gte(targetAmount);

  if (crossedFunded) {
    return { nextStatus: "FUNDED", event: "IGNITE_REVEAL" };
  }

  if (crossedHalfway) {
    return { nextStatus: "HALFWAY", event: "BRIDGE_THE_GAP" };
  }

  // Preserve HALFWAY status if already reached but not yet funded
  if (currentStatus === "HALFWAY") {
    return { nextStatus: "HALFWAY", event: null };
  }

  return { nextStatus: "ACTIVE", event: null };
}
