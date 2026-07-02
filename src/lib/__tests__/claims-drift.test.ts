import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { STATS, DRAW, CREDIT } from "@/content/claims";

/**
 * v8 P2.20 — drift regression: the site fails its build if a banned/retired
 * term or figure reappears in any user-facing source file. Extend
 * src/content/claims.ts instead of hardcoding new claims.
 * (Proven to fail on injection during v8 — see REVIEW.md.)
 */
const BANNED = [
  "light a pot", "Kindlers", "Joint Fire", "Spark Balance", "Goal Booster Draw",
  "£3.2bn", "£3.2B", "£3.2 billion", "wish board", "Fully Lit", "Mum Knows Best",
  "Campfire", "user-scalable=no", "userScalable: false",
  "OnePoll", "Halifax Bank", "WRAP UK", "YouGov", "Money & Pensions Service",
  // v8.1: "pot" is retired as the user-facing noun (internal identifiers keep it)
  "Start a pot", "start a pot", "your pot", "a shared pot", "joint pot", "surprise pot",
  "My pots", "the pot ", "this pot ", "live pot",
];
// Identifiers/history that legitimately contain banned substrings.
const ALLOW_RE = /JointFire|useFire|FirstKindlers|kindled!|REVIEW|PLAN|AUDIT|TODO-FOUNDER|claims-drift/;

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (!/node_modules|__tests__/.test(p)) walk(p, out); }
    else if (/\.(tsx|ts|json)$/.test(f) && !/\.test\./.test(f)) out.push(p);
  }
  return out;
}

describe("claims drift guard", () => {
  const files = [...walk("src/app"), ...walk("src/components"), ...walk("src/data"), ...walk("src/content")];

  it("no banned or retired terms in user-facing source", () => {
    const hits: string[] = [];
    for (const f of files) {
      const lines = readFileSync(f, "utf-8").split("\n");
      lines.forEach((line, i) => {
        if (ALLOW_RE.test(line)) return;
        for (const term of BANNED) {
          if (line.includes(term)) hits.push(`${f}:${i + 1} → "${term}"`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("canonical claims are the only versions in play", () => {
    expect(STATS.unwantedGiftSpend.value).toBe("£1.27bn");
    expect(STATS.receivedUnwanted.value).toBe("3 in 5");
    expect(STATS.wastePerPerson.value).toBe("£41");
    expect(DRAW.name).toBe("quarterly prize draw");
    expect(CREDIT.line).toContain("catalogue purchases");
  });

  it("viewport allows pinch-zoom (no maximum-scale / user-scalable=no)", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf-8");
    expect(layout).not.toContain("maximumScale");
    expect(layout).not.toContain("userScalable");
  });
});
