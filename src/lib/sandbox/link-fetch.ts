/**
 * Paste-a-link wish builder — server-side product fetcher (v11 WS-3).
 *
 * SECURITY (non-negotiable, unit-tested):
 * - http(s) only; credentials stripped; DNS resolved and private/internal/
 *   link-local targets refused BEFORE any request; redirects followed manually
 *   (max 3) with every hop re-validated; 6s timeout; 512KB read cap.
 * - Fetched HTML is never rendered — fields are extracted by tag parsing only.
 *
 * Extraction order: JSON-LD Product → OpenGraph → <title>. Every paste is
 * normalised to category/retailer/price-band — the intent-data engine and the
 * future affiliate bridge.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 2 * 1024 * 1024; // hard read cap — memory stays bounded; oversize pages are truncated, not rejected (meta lives in <head>)
const TIMEOUT_MS = 6_000;
const MAX_REDIRECTS = 3;

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number) as [number, number];
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a >= 224 // multicast/reserved
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") ||
    v6.startsWith("fe80") || v6.startsWith("::ffff:127.") || v6.startsWith("::ffff:10.") ||
    v6.startsWith("::ffff:192.168.") || v6.startsWith("::ffff:169.254.");
}

/** Validate a URL for outbound fetching; returns the safe URL or throws. */
export async function validateTarget(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Not a valid link");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http(s) links are supported");
  url.username = ""; url.password = "";
  const host = url.hostname;
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("That address can't be fetched");
  }
  // Literal IPs and DNS results must both be public.
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new Error("That address can't be fetched");
  } else {
    const results = await lookup(host, { all: true }).catch(() => []);
    if (results.length === 0) throw new Error("That site can't be reached");
    if (results.some((r) => isPrivateAddress(r.address))) throw new Error("That address can't be fetched");
  }
  return url;
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    chunks.push(value);
    if (total > MAX_BYTES) { void reader.cancel(); break; } // cap reached: stop reading, extract from what we have
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
}

export interface LinkPreview {
  title: string;
  image?: string;
  price?: number;
  retailer: string;
  category: string;
  priceBand: "under25" | "25to100" | "100to500" | "over500";
}

const meta = (html: string, prop: string): string | undefined => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  const alt = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i");
  return html.match(re)?.[1] ?? html.match(alt)?.[1];
};

const CATEGORY_KEYWORDS: [string, string][] = [
  ["razor|shav|groom|trimmer", "Grooming"], ["telescope|binocular|science", "Science"],
  ["coffee|espresso|kettle|toaster|air fryer|blender", "Kitchen"], ["lego|toy|playset|doll", "Toys"],
  ["trainer|running|football|gym|fitness|bike|cycle", "Sports"], ["console|playstation|xbox|nintendo|game", "Games"],
  ["tent|camping|lantern|hiking|outdoor", "Outdoors"], ["keyboard|mouse|monitor|laptop|headphone|speaker", "Tech"],
  ["book|novel|atlas", "Books"], ["perfume|skincare|moisturiser|beauty", "Beauty"],
  ["sofa|lamp|cushion|candle|burner|home", "Home"], ["craft|paint|bead|knit", "Craft"],
];

export function categorise(title: string): string {
  const t = title.toLowerCase();
  for (const [re, cat] of CATEGORY_KEYWORDS) if (new RegExp(re).test(t)) return cat;
  return "Other";
}

export const bandOf = (p: number): LinkPreview["priceBand"] =>
  p < 25 ? "under25" : p <= 100 ? "25to100" : p <= 500 ? "100to500" : "over500";

export function extractFields(html: string, host: string): Omit<LinkPreview, "priceBand" | "category"> & { category: string; priceBand: LinkPreview["priceBand"] } {
  let title = "", image: string | undefined, price: number | undefined;
  // JSON-LD Product
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const blob = JSON.parse(m[1]!.trim()) as unknown;
      const nodes = Array.isArray(blob) ? blob : [blob];
      for (const nRaw of nodes) {
        const n = nRaw as { "@type"?: string; name?: string; image?: string | string[]; offers?: { price?: string | number } | { price?: string | number }[] };
        if (n["@type"] === "Product" || (Array.isArray(n["@type"]) && (n["@type"] as string[]).includes("Product"))) {
          title ||= n.name ?? "";
          image ||= Array.isArray(n.image) ? n.image[0] : n.image;
          const offer = Array.isArray(n.offers) ? n.offers[0] : n.offers;
          const p = Number(offer?.price);
          if (!price && Number.isFinite(p) && p > 0) price = p;
        }
      }
    } catch { /* malformed JSON-LD is common; carry on */ }
  }
  title ||= meta(html, "og:title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
  image ||= meta(html, "og:image");
  if (!price) {
    const p = Number(meta(html, "product:price:amount") ?? meta(html, "og:price:amount"));
    if (Number.isFinite(p) && p > 0) price = p;
  }
  if (!price) {
    const m = html.match(/£\s?(\d{1,4}(?:\.\d{2})?)/);
    if (m) price = Number(m[1]);
  }
  title = title.replace(/\s+/g, " ").trim().slice(0, 90);
  const retailer = host.replace(/^www\./, "").split(".")[0] ?? "Web";
  const priceValue = price && price > 0 && price < 100_000 ? Math.round(price) : undefined;
  return {
    title,
    ...(image?.startsWith("http") ? { image } : {}),
    ...(priceValue ? { price: priceValue } : {}),
    retailer: retailer.charAt(0).toUpperCase() + retailer.slice(1),
    category: categorise(title),
    priceBand: bandOf(priceValue ?? 50),
  };
}

export async function fetchLinkPreview(raw: string): Promise<LinkPreview> {
  let url = await validateTarget(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "KindledLinkPreview/1.0 (+https://kindledgift.co.uk)", Accept: "text/html" },
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc || hop === MAX_REDIRECTS) throw new Error("Too many redirects");
      url = await validateTarget(new URL(loc, url).href); // re-validate every hop
      continue;
    }
    if (!res.ok) throw new Error("That page couldn't be fetched");
    const html = await readCapped(res);
    const f = extractFields(html, url.hostname);
    if (!f.title) throw new Error("Couldn't read a product from that page");
    return f;
  }
  throw new Error("Too many redirects");
}
