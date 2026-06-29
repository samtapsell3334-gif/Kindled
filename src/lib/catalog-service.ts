/**
 * CatalogService — the backbone of the affiliate-driven Conversion Engine.
 *
 * Abstracts away individual retailer APIs and affiliate networks (Awin / Impact
 * / Amazon) behind one normalised interface:
 *  - `fetchProductFeed` normalises a raw retailer feed (CSV/JSON rows) into clean
 *    CatalogProducts, dropping anything broken or out of stock so the UI never
 *    shows a dead link or an outdated price.
 *  - `trackingDecorator` wraps any product URL in the correct affiliate string.
 *  - `recommendRetailers` surfaces retailers relevant to a Fire's milestone goal.
 *  - `priceDrop` flags >5% price drops for the "Smart Shopper" monitor.
 *  - ASA compliance: affiliate links are flagged + the required disclosure and
 *    nofollow/sponsored rel are exported for the UI.
 */

import retailersConfig from "@/config/retailers.json";
import type { MilestoneCategory } from "@/lib/cumulative-projection";

// ─── Retailer registry ──────────────────────────────────────────────────────────

export interface Retailer {
  id: string;
  name: string;
  /** Affiliate commission as a percent (e.g. 5 = 5%). */
  commission_rate: number;
  category: MilestoneCategory;
  network?: string;
  domain?: string;
}

export const RETAILERS: Retailer[] = (retailersConfig.retailers as Retailer[]);
const RETAILER_BY_ID = new Map(RETAILERS.map((r) => [r.id, r]));

export function getRetailer(id: string): Retailer | undefined {
  return RETAILER_BY_ID.get(id);
}

/** Retailers relevant to a Fire's milestone goal, best commission first. */
export function recommendRetailers(category: MilestoneCategory, limit = 6): Retailer[] {
  return RETAILERS
    .filter((r) => r.category === category)
    .sort((a, b) => b.commission_rate - a.commission_rate)
    .slice(0, limit);
}

// ─── Affiliate tracking + compliance ─────────────────────────────────────────────

/**
 * The exact share of an affiliate commission returned to the user as cashback.
 * Mirrors the investor "Cashback Math": on a 5% commission the user gets 3% (0.6)
 * and the platform keeps 2% (0.4).
 */
export const USER_CASHBACK_SHARE = 0.6;

export interface CommissionSplit {
  /** Total commission percent the retailer pays. */
  total: number;
  /** Percent returned to the user as cashback. */
  userBonus: number;
  /** Percent retained by the platform. */
  platformProfit: number;
}

export function splitCommission(retailerOrRate: Retailer | number): CommissionSplit {
  const total = typeof retailerOrRate === "number" ? retailerOrRate : retailerOrRate.commission_rate;
  const userBonus = Math.round(total * USER_CASHBACK_SHARE * 100) / 100;
  return { total, userBonus, platformProfit: Math.round((total - userBonus) * 100) / 100 };
}

/** UK ASA-required disclosure for any surface that shows affiliate links. */
export const AFFILIATE_DISCLOSURE = "Contains affiliate links — Kindled may earn a commission, at no extra cost to you.";

/** rel attribute for outbound affiliate anchors (SEO + ASA: nofollow + sponsored). */
export const AFFILIATE_LINK_REL = "nofollow sponsored noopener noreferrer";

/** Whether a link to this retailer is a tracked affiliate link (drives disclosure). */
export function isAffiliateLink(retailerId: string): boolean {
  return RETAILER_BY_ID.has(retailerId);
}

/**
 * Wrap any product URL in the correct affiliate tracking string. Idempotent —
 * re-decorating a URL just overwrites the `aff` param.
 */
export function trackingDecorator(productUrl: string, retailerId: string, affiliateId = "kindled"): string {
  const tag = `${affiliateId}_${retailerId}`;
  try {
    const u = new URL(productUrl);
    u.searchParams.set("aff", tag);
    return u.toString();
  } catch {
    const sep = productUrl.includes("?") ? "&" : "?";
    return `${productUrl}${sep}aff=${encodeURIComponent(tag)}`;
  }
}

// ─── Feed normalisation ──────────────────────────────────────────────────────────

/** A loose row shape mirroring the varied columns of Awin / Impact / Amazon feeds. */
export interface RawFeedProduct {
  product_id?: string; aw_product_id?: string; id?: string | number; sku?: string;
  product_name?: string; name?: string; title?: string;
  search_price?: string | number; price?: string | number; display_price?: string;
  merchant_image_url?: string; aw_image_url?: string; large_image?: string; image_url?: string; image?: string;
  in_stock?: string | number | boolean; stock_status?: string; availability?: string;
  aw_deep_link?: string; merchant_deep_link?: string; deep_link?: string; url?: string; link?: string;
  currency?: string;
}

export interface CatalogProduct {
  id: string;
  retailerId: string;
  name: string;
  price: number;
  currency: string;
  /** Highest-resolution image available in the feed. */
  image: string;
  inStock: boolean;
  /** Merchant deep link (not yet affiliate-decorated — call trackingDecorator). */
  url: string;
}

function firstString(...vals: (string | number | undefined)[]): string {
  for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  return "";
}

function parsePrice(raw: string | number | undefined): number {
  if (raw === undefined) return NaN;
  if (typeof raw === "number") return raw;
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return n;
}

function parseStock(row: RawFeedProduct): boolean {
  if (typeof row.in_stock === "boolean") return row.in_stock;
  const s = firstString(row.in_stock, row.stock_status, row.availability).toLowerCase();
  if (s === "") return true; // assume available if the feed is silent
  if (["0", "no", "false", "out of stock", "outofstock", "unavailable"].includes(s)) return false;
  return true;
}

/**
 * Normalise a retailer feed into clean CatalogProducts. Rows with no image, no
 * valid price, or that are out of stock are dropped — so we never surface a
 * broken link or an outdated/unavailable product.
 */
export function fetchProductFeed(retailerId: string, rows: RawFeedProduct[]): CatalogProduct[] {
  const out: CatalogProduct[] = [];
  for (const row of rows) {
    const image = firstString(row.large_image, row.merchant_image_url, row.aw_image_url, row.image_url, row.image);
    const price = parsePrice(firstString(row.search_price, row.price, row.display_price));
    const url = firstString(row.aw_deep_link, row.merchant_deep_link, row.deep_link, row.url, row.link);
    const name = firstString(row.product_name, row.name, row.title);
    const inStock = parseStock(row);
    if (!image || !url || !name || !Number.isFinite(price) || price <= 0 || !inStock) continue;
    out.push({
      id: firstString(row.aw_product_id, row.product_id, row.id, row.sku) || url,
      retailerId,
      name,
      price,
      currency: firstString(row.currency) || "GBP",
      image,
      inStock,
      url,
    });
  }
  return out;
}

// ─── Smart Shopper price monitor ─────────────────────────────────────────────────

export interface PriceDrop {
  dropped: boolean;
  /** Percent drop (positive number) from previous to current. */
  pct: number;
  saved: number;
}

/** Flags a meaningful (>5%) price drop for a tracked product. */
export function priceDrop(previousPrice: number, currentPrice: number, threshold = 0.05): PriceDrop {
  if (!(previousPrice > 0) || !(currentPrice >= 0) || currentPrice >= previousPrice) {
    return { dropped: false, pct: 0, saved: 0 };
  }
  const pct = (previousPrice - currentPrice) / previousPrice;
  return { dropped: pct >= threshold, pct: Math.round(pct * 1000) / 10, saved: Math.round((previousPrice - currentPrice) * 100) / 100 };
}
