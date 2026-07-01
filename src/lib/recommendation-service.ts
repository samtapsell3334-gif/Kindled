/**
 * RecommendationService — the catalogue "Relevance Engine".
 *
 * Cross-references a Fire's Major-Goal milestone category with the product feed and
 * scores every product for how well it fits the user's journey, so the catalogue can
 * pin high-relevance items in a "Recommended for your Journey" rail and attach a
 * "Why this fits your milestone" reason to each card.
 *
 * Pure and framework-free — the same scoring runs on the server (feed ingestion) and
 * the client (re-ranking). Revenue attribution for click-throughs lives in
 * revenue-tracking.ts; retailer commission lookup in catalog-service.ts.
 */

import type { MilestoneCategory } from "@/lib/cumulative-projection";

/** A normalised product from the feed, ready to be scored/ranked. */
export interface RecommendableProduct {
  id: string;
  name: string;
  price: number;
  /** Broad interest/category tag from the feed (e.g. "Travel", "Home", "Tech"). */
  category: string;
  image?: string;
  retailerId?: string;
  /** Optional explicit affinity the feed already declares. */
  milestoneAffinity?: MilestoneCategory[];
}

export interface Recommendation {
  product: RecommendableProduct;
  /** 0–1 relevance to the milestone category. */
  score: number;
  /** "Why this fits your milestone" copy for the card. */
  reason: string;
  /** True when it clears the pin threshold for the "Recommended" rail. */
  pinned: boolean;
}

interface CategoryProfile {
  /** Feed categories that strongly match this milestone. */
  categories: string[];
  /** Name keywords that indicate a match. */
  keywords: string[];
  /** Card reason when a product matches. */
  reason: string;
}

/** How each milestone maps onto the product feed — the heart of the relevance engine. */
export const MILESTONE_AFFINITY: Record<MilestoneCategory, CategoryProfile> = {
  EXPEDITION: {
    categories: ["Travel", "Sport", "Experiences", "Outdoors"],
    keywords: ["travel", "luggage", "backpack", "camera", "tent", "surf", "hik", "flight", "adventure", "outdoor"],
    reason: "Kit for the adventure you're saving toward",
  },
  FOUNDATION: {
    categories: ["Home", "Kitchen", "Garden", "Furniture", "DIY"],
    keywords: ["home", "kitchen", "sofa", "furniture", "mixer", "coffee", "bed", "tool", "renovat"],
    reason: "Builds the home you're working toward",
  },
  CELEBRATION: {
    categories: ["Experiences", "Fashion", "Beauty", "Food & Drink", "Toys"],
    keywords: ["party", "dining", "spa", "dinner", "champagne", "balloon", "dress", "watch", "experience"],
    reason: "Makes the big moment unforgettable",
  },
  LEGACY: {
    categories: ["Jewellery", "Books", "Toys", "Fashion"],
    keywords: ["necklace", "ring", "jewel", "keepsake", "heirloom", "watch", "book", "savings", "gold"],
    reason: "A lasting gift for the future",
  },
};

const norm = (s: string) => s.toLowerCase();

/**
 * Score a single product's relevance to a milestone category, 0–1.
 * Signals (weighted): explicit affinity > category match > keyword match.
 */
export function scoreRelevance(product: RecommendableProduct, category: MilestoneCategory): number {
  const profile = MILESTONE_AFFINITY[category];
  let score = 0;

  if (product.milestoneAffinity?.includes(category)) score += 0.6;

  const cat = norm(product.category);
  if (profile.categories.some((c) => norm(c) === cat)) score += 0.3;
  else if (profile.categories.some((c) => cat.includes(norm(c)) || norm(c).includes(cat))) score += 0.18;

  const name = norm(product.name);
  const hits = profile.keywords.filter((k) => name.includes(k)).length;
  score += Math.min(0.3, hits * 0.15);

  return Math.min(1, Math.round(score * 100) / 100);
}

/** Minimum score to be pinned in the "Recommended for your Journey" rail. */
export const PIN_THRESHOLD = 0.3;

/**
 * Rank the whole feed for a journey: best-fit first, each tagged with its reason and
 * whether it clears the pin threshold. `limit` caps the returned list (0 = all).
 */
export function recommendForJourney(
  products: RecommendableProduct[],
  category: MilestoneCategory,
  limit = 0,
): Recommendation[] {
  const profile = MILESTONE_AFFINITY[category];
  const ranked = products
    .map<Recommendation>((product) => {
      const score = scoreRelevance(product, category);
      return { product, score, reason: score >= PIN_THRESHOLD ? profile.reason : "Popular with gifters", pinned: score >= PIN_THRESHOLD };
    })
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price);
  return limit > 0 ? ranked.slice(0, limit) : ranked;
}

/** Just the pinned, high-relevance items for the "Recommended for your Journey" rail. */
export function pinnedForJourney(products: RecommendableProduct[], category: MilestoneCategory, limit = 6): Recommendation[] {
  return recommendForJourney(products, category).filter((r) => r.pinned).slice(0, limit);
}
