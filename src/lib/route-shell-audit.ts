/**
 * Route-shell audit engine (v11.1 P0-1).
 *
 * Runs against the BUILT html of every prerendered route. This is the gate the
 * external audit demanded: the v8 source-level drift tests missed problems that
 * only exist in rendered output (per-route metadata, inherited-or-not OG
 * images, client-shell copy). Each rule returns named findings so the test can
 * prove, per rule, that it fails on injected bad input and passes on the real
 * build.
 */

export interface ShellFinding { rule: string; detail: string }

const CANONICAL_THEME = "#0C4E4C";

/** User-facing lexicon banned from rendered output (script payloads stripped
 *  first — internal identifiers like pot_created are allowed internals). */
const BANNED_VISIBLE: [string, RegExp][] = [
  ["kindle-as-verb", />Kindle</],
  ["kindlers", /Kindlers/],
  ["user-facing-pots", />\s*[^<]*\b(Start a pot|your pot|a shared pot|shared pots|joint pot|surprise pot|My pots)\b/i],
  ["retired-stat", /£3\.2\s?bn|£3\.2 billion|OnePoll|YouGov/],
  ["ai-selling", />[^<]*\b(AI reveal|AI-powered|powered by AI)\b[^<]*</i],
];

const stripScripts = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, "");

export function auditShell(route: string, html: string): ShellFinding[] {
  const findings: ShellFinding[] = [];
  const visible = stripScripts(html);

  for (const [rule, re] of BANNED_VISIBLE) {
    const m = visible.match(re);
    if (m) findings.push({ rule, detail: `${route}: "${m[0].slice(0, 60)}"` });
  }

  // Viewport must stay zoomable (WCAG).
  if (/user-scalable=no|maximum-scale=1\b/.test(html)) {
    findings.push({ rule: "viewport-locked", detail: route });
  }

  // Per-route theme colour = canonical teal.
  const theme = html.match(/name="theme-color" content="([^"]+)"/)?.[1];
  if (theme && theme.toUpperCase() !== CANONICAL_THEME) {
    findings.push({ rule: "theme-color", detail: `${route}: ${theme}` });
  }

  // A route declaring a large card must supply an image.
  const largeCard = /name="twitter:card" content="summary_large_image"/.test(html);
  const hasOg = /property="og:image"/.test(html);
  if (largeCard && !hasOg) {
    findings.push({ rule: "large-card-no-image", detail: route });
  }

  // Descriptions must never carry a retired noun (the actual drift risk —
  // utility pages legitimately describe themselves without "wish").
  const desc = html.match(/name="description" content="([^"]+)"/)?.[1] ?? "";
  if (/\bpots?\b|wish board/i.test(desc)) {
    findings.push({ rule: "meta-noun", detail: `${route}: "${desc.slice(0, 60)}"` });
  }

  return findings;
}

/** Stats must server-render their true figures — a counter frozen at 0 next to
 *  a claim is the exact regression the audit caught. */
export function auditStatsBlock(route: string, html: string): ShellFinding[] {
  const findings: ShellFinding[] = [];
  if (/>0%<[\s\S]{0,200}?(unwanted gift|received an unwant)/i.test(html)) {
    findings.push({ rule: "zeroed-counter", detail: route });
  }
  return findings;
}
