import { describe, it, expect } from "vitest";
import { trackClickThrough } from "@/lib/revenue-tracking";

/**
 * Revenue-attribution tests — the click-through event that backs Phase-1 affiliate
 * revenue. The event payload must carry who/what/which-journey for reconciliation.
 */
describe("trackClickThrough", () => {
  it("builds a fully-attributed event and a decorated URL", () => {
    const { event, url } = trackClickThrough({
      userId: "u1",
      productId: "prod9",
      retailerId: "acme",
      productUrl: "https://shop.acme.com/p/9",
      milestoneCategory: "FOUNDATION",
      now: 1000,
    });
    expect(event.event).toBe("catalogue_click_through");
    expect(event.userId).toBe("u1");
    expect(event.productId).toBe("prod9");
    expect(event.retailerId).toBe("acme");
    expect(event.milestoneCategory).toBe("FOUNDATION");
    expect(event.affiliateTag).toBe("kindled_acme");
    expect(event.timestamp).toBe(1000);
    expect(url).toContain("shop.acme.com");
  });

  it("defaults milestoneCategory to null for ad-hoc browsing and honours a custom affiliate id", () => {
    const { event } = trackClickThrough({
      userId: "u2",
      productId: "p",
      retailerId: "r",
      productUrl: "https://x.test/p",
      affiliateId: "partnerX",
      now: 5,
    });
    expect(event.milestoneCategory).toBeNull();
    expect(event.affiliateTag).toBe("partnerX_r");
  });

  it("reports a null commission rate for an unknown retailer", () => {
    const { event } = trackClickThrough({
      userId: "u", productId: "p", retailerId: "not-a-real-retailer", productUrl: "https://x.test/p",
    });
    expect(event.commissionRate).toBeNull();
  });
});
