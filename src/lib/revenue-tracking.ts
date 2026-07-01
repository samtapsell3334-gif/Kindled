/**
 * Revenue tracking — captures the attribution data behind Phase-1 affiliate revenue.
 *
 * Every catalogue click-through records who clicked, what they clicked, and which
 * milestone journey it came from, so commission can be reconciled against the
 * retailer's confirmed-order webhook and the intent-data feed can be segmented.
 *
 * Pure builder: `trackClickThrough` returns the event payload + the decorated URL.
 * In production the payload is POSTed to the analytics sink; the URL is followed.
 */

import type { MilestoneCategory } from "@/lib/cumulative-projection";
import { trackingDecorator, getRetailer } from "@/lib/catalog-service";

export interface ClickThroughEvent {
  event: "catalogue_click_through";
  userId: string;
  productId: string;
  retailerId: string;
  /** The Fire's milestone category this click came from (drives intent-data value). */
  milestoneCategory: MilestoneCategory | null;
  /** Retailer commission percent at click time (for expected-revenue modelling). */
  commissionRate: number | null;
  /** Affiliate tag applied to the outbound URL. */
  affiliateTag: string;
  timestamp: number;
}

export interface TrackedClick {
  event: ClickThroughEvent;
  /** Affiliate-decorated URL to open. */
  url: string;
}

/**
 * Build the attribution event + decorated URL for a catalogue click-through.
 * `milestoneCategory` is null for ad-hoc (non-milestone) browsing.
 */
export function trackClickThrough(params: {
  userId: string;
  productId: string;
  retailerId: string;
  productUrl: string;
  milestoneCategory?: MilestoneCategory | null;
  affiliateId?: string;
  now?: number;
}): TrackedClick {
  const { userId, productId, retailerId, productUrl, milestoneCategory = null, affiliateId = "kindled", now = Date.now() } = params;
  const url = trackingDecorator(productUrl, retailerId, affiliateId);
  const commission = getRetailer(retailerId)?.commission_rate ?? null;
  return {
    event: {
      event: "catalogue_click_through",
      userId,
      productId,
      retailerId,
      milestoneCategory,
      commissionRate: commission,
      affiliateTag: `${affiliateId}_${retailerId}`,
      timestamp: now,
    },
    url,
  };
}

/**
 * Fire-and-forget delivery of a click event to the analytics sink. Uses `sendBeacon`
 * so it survives the page navigating away to the retailer. No-op on the server.
 */
export function emitClickEvent(event: ClickThroughEvent, endpoint = "/api/track/click"): void {
  if (typeof navigator === "undefined") return;
  try {
    const body = JSON.stringify(event);
    if (typeof navigator.sendBeacon === "function") navigator.sendBeacon(endpoint, body);
    else void fetch(endpoint, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    /* analytics must never block the click */
  }
}
