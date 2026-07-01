import { describe, it, expect } from "vitest";
import {
  scoreRelevance, recommendForJourney, pinnedForJourney, PIN_THRESHOLD,
  type RecommendableProduct,
} from "@/lib/recommendation-service";

/**
 * Relevance-engine tests — the catalogue ranking behind "Recommended for your Journey".
 */
const p = (over: Partial<RecommendableProduct> & { id: string }): RecommendableProduct => ({
  name: "Item", price: 20, category: "Misc", ...over,
});

describe("scoreRelevance", () => {
  it("stacks explicit affinity + category + keyword signals, capped at 1", () => {
    const score = scoreRelevance(
      p({ id: "a", category: "Travel", name: "Travel backpack", milestoneAffinity: ["EXPEDITION"] }),
      "EXPEDITION",
    );
    expect(score).toBe(1); // 0.6 + 0.3 + 0.3 → capped
  });

  it("gives 0.3 for an exact category match alone (clears the pin threshold)", () => {
    expect(scoreRelevance(p({ id: "b", category: "Home", name: "Nondescript" }), "FOUNDATION")).toBe(0.3);
  });

  it("scores an irrelevant product at 0", () => {
    expect(scoreRelevance(p({ id: "c", category: "Random", name: "Widget" }), "EXPEDITION")).toBe(0);
  });
});

describe("recommendForJourney", () => {
  const feed = [
    p({ id: "low", category: "Random", name: "Widget", price: 10 }),
    p({ id: "high", category: "Travel", name: "Adventure tent", milestoneAffinity: ["EXPEDITION"], price: 50 }),
    p({ id: "mid", category: "Sport", name: "Plain", price: 5 }),
  ];

  it("ranks best-fit first and tags each with reason + pinned", () => {
    const ranked = recommendForJourney(feed, "EXPEDITION");
    expect(ranked[0]?.product.id).toBe("high");
    expect(ranked[0]?.pinned).toBe(true);
    expect(ranked[0]?.reason).toBe("Kit for the adventure you're saving toward");
    const last = ranked[ranked.length - 1];
    expect(last?.product.id).toBe("low");
    expect(last?.pinned).toBe(false);
    expect(last?.reason).toBe("Popular with gifters");
  });

  it("breaks score ties by cheaper price first", () => {
    const ties = [p({ id: "pricey", price: 99 }), p({ id: "cheap", price: 9 })];
    const ranked = recommendForJourney(ties, "LEGACY");
    expect(ranked.map((r) => r.product.id)).toEqual(["cheap", "pricey"]);
  });

  it("respects the limit", () => {
    expect(recommendForJourney(feed, "EXPEDITION", 1)).toHaveLength(1);
  });
});

describe("pinnedForJourney", () => {
  it("returns only items at/above the pin threshold", () => {
    const feed = [
      p({ id: "keep", category: "Home", name: "Sofa", milestoneAffinity: ["FOUNDATION"] }),
      p({ id: "drop", category: "Random", name: "Nothing" }),
    ];
    const pinned = pinnedForJourney(feed, "FOUNDATION");
    expect(pinned.map((r) => r.product.id)).toEqual(["keep"]);
    expect(pinned.every((r) => r.score >= PIN_THRESHOLD)).toBe(true);
  });
});
