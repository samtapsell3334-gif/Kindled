/**
 * ClaimEngine — the Duplicate Prevention Engine for a Fire's wishlist items.
 *
 * Stops two givers buying the same gift for one Fire. Every item moves through a
 * three-state machine:
 *
 *   AVAILABLE ──claim──▶ PENDING (reserved 30 min) ──confirm──▶ CLAIMED
 *        ▲                   │                                     ▲
 *        └──release / expiry─┘            auto-tick (webhook) ─────┘
 *
 * The reservation is a soft, time-boxed lock so a giver can check out without
 * someone else buying underneath them; it auto-expires so an abandoned reservation
 * never strands a gift.
 *
 * ── Atomicity / mutex ──────────────────────────────────────────────────────────
 * The race ("two people click Claim in the same millisecond") is resolved at the
 * database, NOT here, via a single conditional UPDATE that acts as a compare-and-set:
 *
 *   UPDATE pot_items
 *      SET claim_status='PENDING', claimed_by_user_id=$uid,
 *          claimed_at=NULL, reserved_until=$until, updated_at=now()
 *    WHERE id=$id
 *      AND (claim_status='AVAILABLE'
 *           OR (claim_status='PENDING' AND reserved_until < now()))   -- expired
 *   RETURNING *;
 *
 * Exactly one transaction's WHERE matches (the row lock serialises them); the loser
 * gets 0 rows and is told the item is taken. `ATOMIC_CLAIM_PREDICATE` below is that
 * WHERE clause so the route handler stays in sync with this engine. The functions
 * here mirror the same decision so the optimistic UI and the server agree.
 */

export type ItemClaimStatus = "AVAILABLE" | "PENDING" | "CLAIMED";

/** Reservation window — a PENDING hold lasts this long, then reverts to AVAILABLE. */
export const RESERVE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/** The SQL predicate (WHERE clause) that makes the claim atomic at the DB layer. */
export const ATOMIC_CLAIM_PREDICATE =
  "claim_status = 'AVAILABLE' OR (claim_status = 'PENDING' AND reserved_until < now())";

export interface ClaimableItem {
  id: string;
  claimStatus: ItemClaimStatus;
  /** Who holds the reservation / made the purchase. */
  claimedByUserId?: string;
  /** Display name for the "being purchased by …" / "Gifted by …" cues. */
  claimedByName?: string;
  /** When a CLAIMED item was confirmed. */
  claimedAt?: number;
  /** Epoch ms a PENDING reservation expires. */
  reservedUntil?: number;
}

export interface ClaimResult {
  ok: boolean;
  item: ClaimableItem;
  /** Human-readable reason when ok = false (surfaced in the UI). */
  reason?: string;
}

const without = <T extends object, K extends keyof ClaimableItem>(o: T, ...keys: K[]): T => {
  const c = { ...o };
  for (const k of keys) delete (c as Record<string, unknown>)[k as string];
  return c;
};

/**
 * The item's *effective* status right now — a PENDING hold whose window has elapsed
 * is treated as AVAILABLE (lazy expiry), so the UI never shows a stale reservation.
 */
export function effectiveStatus(item: ClaimableItem, now: number = Date.now()): ItemClaimStatus {
  if (item.claimStatus === "PENDING" && (item.reservedUntil ?? 0) <= now) return "AVAILABLE";
  return item.claimStatus;
}

/** Milliseconds left on a live reservation (0 if not pending / expired). */
export function reserveRemainingMs(item: ClaimableItem, now: number = Date.now()): number {
  if (effectiveStatus(item, now) !== "PENDING") return 0;
  return Math.max(0, (item.reservedUntil ?? 0) - now);
}

/**
 * STEP 1 — Reserve. Mirrors the atomic DB compare-and-set: succeeds only if the item
 * is effectively AVAILABLE. Whoever calls first wins; everyone else is rejected with
 * a clear message.
 */
export function claim(
  item: ClaimableItem,
  userId: string,
  name: string,
  now: number = Date.now(),
): ClaimResult {
  const status = effectiveStatus(item, now);
  if (status !== "AVAILABLE") {
    return { ok: false, item, reason: guardMessage(item, now) };
  }
  return {
    ok: true,
    item: without({
      ...item,
      claimStatus: "PENDING" as const,
      claimedByUserId: userId,
      claimedByName: name,
      reservedUntil: now + RESERVE_WINDOW_MS,
    }, "claimedAt"),
  };
}

/** Undo / Release — only the holder can release their own live reservation. */
export function release(item: ClaimableItem, userId: string, now: number = Date.now()): ClaimResult {
  if (effectiveStatus(item, now) !== "PENDING" || item.claimedByUserId !== userId) {
    return { ok: false, item, reason: "That reservation isn't yours to release." };
  }
  return {
    ok: true,
    item: without({ ...item, claimStatus: "AVAILABLE" as const }, "claimedByUserId", "claimedByName", "reservedUntil", "claimedAt"),
  };
}

/**
 * STEP 2 — Confirm ("I've ordered this"). Only the holder of a live reservation can
 * promote it to CLAIMED, which removes it from the list permanently.
 */
export function confirmPurchase(item: ClaimableItem, userId: string, now: number = Date.now()): ClaimResult {
  if (effectiveStatus(item, now) !== "PENDING" || item.claimedByUserId !== userId) {
    return { ok: false, item, reason: "Your reservation has expired — claim it again to continue." };
  }
  return {
    ok: true,
    item: without({ ...item, claimStatus: "CLAIMED" as const, claimedByUserId: userId, claimedByName: item.claimedByName ?? "Someone", claimedAt: now }, "reservedUntil"),
  };
}

/**
 * Auto-tick — for retailers with a verified order webhook, a confirmed purchase
 * jumps straight to CLAIMED from any non-claimed state (no reservation step needed).
 */
export function autoTick(item: ClaimableItem, userId: string, name: string, now: number = Date.now()): ClaimResult {
  if (item.claimStatus === "CLAIMED") {
    return { ok: false, item, reason: guardMessage(item, now) };
  }
  return {
    ok: true,
    item: without({ ...item, claimStatus: "CLAIMED" as const, claimedByUserId: userId, claimedByName: name, claimedAt: now }, "reservedUntil"),
  };
}

/** A professional, friendly guard message for a PENDING/CLAIMED item. */
export function guardMessage(item: ClaimableItem, now: number = Date.now()): string {
  const who = item.claimedByName ?? "another giver";
  const status = effectiveStatus(item, now);
  if (status === "CLAIMED") return `${who} has already gifted this — it's sorted.`;
  if (status === "PENDING") return `This item is currently being purchased by ${who}.`;
  return "This item is available.";
}

/** Whether a giver may open the claim flow on an item. */
export function canClaim(item: ClaimableItem, now: number = Date.now()): boolean {
  return effectiveStatus(item, now) === "AVAILABLE";
}

/**
 * Background sweep — revert every expired reservation to AVAILABLE. Returns only the
 * items that changed, for an efficient bulk write. (Lazy `effectiveStatus` covers the
 * read path; this keeps the stored rows tidy.)
 */
export function sweepExpired(items: ClaimableItem[], now: number = Date.now()): ClaimableItem[] {
  return items
    .filter((i) => i.claimStatus === "PENDING" && (i.reservedUntil ?? 0) <= now)
    .map((i) => without({ ...i, claimStatus: "AVAILABLE" as const }, "claimedByUserId", "claimedByName", "reservedUntil"));
}

export interface HostNotification {
  potId: string;
  /** Whether the specific item is revealed; false on surprise pots to protect the reveal. */
  itemRevealed: boolean;
  title: string;
  body: string;
}

/**
 * Build the host notification for a confirmed claim. On a surprise Fire we never name
 * the item or giver — we only nudge that the pot moved — so the reveal stays intact.
 */
export function hostNotification(
  item: ClaimableItem,
  opts: { potId: string; potTitle: string; isSurprise: boolean },
): HostNotification {
  if (opts.isSurprise) {
    return {
      potId: opts.potId,
      itemRevealed: false,
      title: "Your Fire just grew",
      body: `Something on “${opts.potTitle}” was just sorted — kept secret until your reveal.`,
    };
  }
  return {
    potId: opts.potId,
    itemRevealed: true,
    title: "A gift was claimed",
    body: `${item.claimedByName ?? "Someone"} is gifting an item on “${opts.potTitle}”.`,
  };
}
