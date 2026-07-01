import { describe, it, expect } from "vitest";
import {
  RESERVE_WINDOW_MS, effectiveStatus, reserveRemainingMs, claim, release,
  confirmPurchase, autoTick, canClaim, sweepExpired, guardMessage, hostNotification,
  type ClaimableItem,
} from "@/lib/claim-engine";

/**
 * Claim-engine unit tests — the AVAILABLE → PENDING → CLAIMED status machine and its
 * time-boxed reservation. Mirrors the atomic DB compare-and-set so UI and server agree.
 */
const T0 = 1_000_000_000_000;
const available = (): ClaimableItem => ({ id: "item1", claimStatus: "AVAILABLE" });

describe("claim (reserve)", () => {
  it("moves AVAILABLE → PENDING and stamps the holder + window", () => {
    const r = claim(available(), "u1", "Alex", T0);
    expect(r.ok).toBe(true);
    expect(r.item.claimStatus).toBe("PENDING");
    expect(r.item.claimedByUserId).toBe("u1");
    expect(r.item.reservedUntil).toBe(T0 + RESERVE_WINDOW_MS);
    expect(r.item.claimedAt).toBeUndefined();
  });

  it("rejects a claim on a live reservation with a friendly reason", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    const r = claim(held, "u2", "Sam", T0 + 1000);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/being purchased by Alex/i);
  });

  it("allows re-claiming once the reservation has expired", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    const r = claim(held, "u2", "Sam", T0 + RESERVE_WINDOW_MS + 1);
    expect(r.ok).toBe(true);
    expect(r.item.claimedByUserId).toBe("u2");
  });
});

describe("effectiveStatus / reserveRemainingMs", () => {
  it("lazily expires a stale PENDING back to AVAILABLE", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    expect(effectiveStatus(held, T0 + 1000)).toBe("PENDING");
    expect(effectiveStatus(held, T0 + RESERVE_WINDOW_MS + 1)).toBe("AVAILABLE");
  });
  it("counts down the live reservation and floors at zero", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    expect(reserveRemainingMs(held, T0)).toBe(RESERVE_WINDOW_MS);
    expect(reserveRemainingMs(held, T0 + RESERVE_WINDOW_MS + 5)).toBe(0);
  });
});

describe("release", () => {
  it("only the holder can release their live reservation", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    expect(release(held, "u2", T0 + 1).ok).toBe(false);
    const r = release(held, "u1", T0 + 1);
    expect(r.ok).toBe(true);
    expect(r.item.claimStatus).toBe("AVAILABLE");
    expect(r.item.claimedByUserId).toBeUndefined();
    expect(r.item.reservedUntil).toBeUndefined();
  });
});

describe("confirmPurchase", () => {
  it("promotes the holder's live reservation to CLAIMED", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    const r = confirmPurchase(held, "u1", T0 + 1000);
    expect(r.ok).toBe(true);
    expect(r.item.claimStatus).toBe("CLAIMED");
    expect(r.item.claimedAt).toBe(T0 + 1000);
    expect(r.item.reservedUntil).toBeUndefined();
  });
  it("fails after the reservation has expired", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    const r = confirmPurchase(held, "u1", T0 + RESERVE_WINDOW_MS + 1);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/expired/i);
  });
});

describe("autoTick", () => {
  it("jumps an available item straight to CLAIMED (verified-order webhook)", () => {
    const r = autoTick(available(), "u9", "Retailer", T0);
    expect(r.ok).toBe(true);
    expect(r.item.claimStatus).toBe("CLAIMED");
  });
  it("refuses to double-claim an already CLAIMED item", () => {
    const claimed = autoTick(available(), "u9", "Retailer", T0).item;
    const r = autoTick(claimed, "u1", "Alex", T0 + 1);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/already gifted/i);
  });
});

describe("canClaim / sweepExpired / guardMessage / hostNotification", () => {
  it("canClaim tracks effective availability", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    expect(canClaim(available(), T0)).toBe(true);
    expect(canClaim(held, T0 + 1000)).toBe(false);
    expect(canClaim(held, T0 + RESERVE_WINDOW_MS + 1)).toBe(true);
  });

  it("sweepExpired reverts only the stale reservations", () => {
    // i1 reserved late (still inside its window at sweep time), i2 reserved at T0 (expired), i3 already CLAIMED.
    const live = claim({ id: "i1", claimStatus: "AVAILABLE" }, "u1", "Alex", T0 + RESERVE_WINDOW_MS).item;
    const stale = claim({ id: "i2", claimStatus: "AVAILABLE" }, "u2", "Sam", T0).item;
    const claimed = autoTick({ id: "i3", claimStatus: "AVAILABLE" }, "u3", "Kit", T0).item;
    const changed = sweepExpired([live, stale, claimed], T0 + RESERVE_WINDOW_MS + 1);
    expect(changed.map((i) => i.id)).toEqual(["i2"]);
    expect(changed[0]?.claimStatus).toBe("AVAILABLE");
    expect(changed[0]?.claimedByUserId).toBeUndefined();
  });

  it("guardMessage differentiates pending vs claimed", () => {
    const held = claim(available(), "u1", "Alex", T0).item;
    expect(guardMessage(held, T0 + 1000)).toMatch(/being purchased/i);
    const claimed = autoTick(available(), "u9", "Retailer", T0).item;
    expect(guardMessage(claimed, T0 + 1)).toMatch(/already gifted/i);
  });

  it("keeps surprise Fires spoiler-free in host notifications", () => {
    const claimed = confirmPurchase(claim(available(), "u1", "Alex", T0).item, "u1", T0 + 1).item;
    const surprise = hostNotification(claimed, { potId: "p1", potTitle: "Billy's Bike", isSurprise: true });
    expect(surprise.itemRevealed).toBe(false);
    expect(surprise.body).not.toMatch(/Alex/);
    const open = hostNotification(claimed, { potId: "p1", potTitle: "Billy's Bike", isSurprise: false });
    expect(open.itemRevealed).toBe(true);
    expect(open.body).toMatch(/Alex/);
  });
});
