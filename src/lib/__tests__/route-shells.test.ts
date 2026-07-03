import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { auditShell, auditStatsBlock } from "../route-shell-audit";

/**
 * v11.1 P0-1 — the gate. Two halves:
 *  1. INJECTION PROOF: every rule demonstrably fails on crafted bad input
 *     (this is what "prove each test fails on injection" means — the checks
 *     themselves are exercised, not assumed).
 *  2. BUILT-OUTPUT SWEEP: every prerendered route's html passes every rule.
 *     Requires `npm run build` first; fails loudly if the build is absent so
 *     the gate can never silently skip in CI.
 */

const BUILD_DIR = ".next/server/app";

function builtRoutes(): [string, string][] {
  const out: [string, string][] = [];
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (f.endsWith(".html")) out.push([full.replace(BUILD_DIR, "").replace(".html", "") || "/", readFileSync(full, "utf-8")]);
    }
  };
  walk(BUILD_DIR);
  return out;
}

describe("route-shell gate: injection proof (each rule detects its miss)", () => {
  const base = `<html><head>
    <meta name="theme-color" content="#0C4E4C"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta property="og:image" content="/og.png"/>
    <meta name="description" content="One shared wish, one link."/>
  </head><body></body></html>`;

  it("catches Kindle-as-verb", () => {
    expect(auditShell("/x", base.replace("<body>", "<body><button>Kindle</button>")).some((f) => f.rule === "kindle-as-verb")).toBe(true);
  });
  it("catches user-facing pot phrases", () => {
    expect(auditShell("/x", base.replace("<body>", "<body><p>Start a pot today</p>")).some((f) => f.rule === "user-facing-pots")).toBe(true);
  });
  it("catches retired stats and Kindlers", () => {
    expect(auditShell("/x", base.replace("<body>", "<body><p>£3.2bn wasted</p>")).some((f) => f.rule === "retired-stat")).toBe(true);
    expect(auditShell("/x", base.replace("<body>", "<body><p>Join the Kindlers</p>")).some((f) => f.rule === "kindlers")).toBe(true);
  });
  it("catches a locked viewport", () => {
    expect(auditShell("/x", base + '<meta name="viewport" content="user-scalable=no"/>').some((f) => f.rule === "viewport-locked")).toBe(true);
  });
  it("catches a non-canonical theme colour", () => {
    expect(auditShell("/x", base.replace("#0C4E4C", "#ffffff")).some((f) => f.rule === "theme-color")).toBe(true);
  });
  it("catches a large card with no og:image", () => {
    expect(auditShell("/x", base.replace(/<meta property="og:image"[^>]*>/, "")).some((f) => f.rule === "large-card-no-image")).toBe(true);
  });
  it("catches a retired noun in a description", () => {
    expect(auditShell("/x", base.replace("One shared wish, one link.", "One shared pot, one link.")).some((f) => f.rule === "meta-noun")).toBe(true);
  });
  it("catches a zeroed stat counter", () => {
    expect(auditStatsBlock("/x", "<p>0%</p><p>Have received an unwanted gift</p>").some((f) => f.rule === "zeroed-counter")).toBe(true);
  });
  it("ignores internals inside script payloads (no false positives)", () => {
    expect(auditShell("/x", base + '<script>self.__next_f.push(["pot_created","My pots"])</script>')).toEqual([]);
  });
});

describe("route-shell gate: BUILT output of every route", () => {
  it("the build exists (run `npm run build` before the suite — the gate never skips)", () => {
    expect(existsSync(BUILD_DIR), "Run npm run build first; the route gate audits built output.").toBe(true);
  });

  it("every prerendered route passes every rule", () => {
    const failures = builtRoutes().flatMap(([route, html]) => [
      ...auditShell(route, html),
      ...auditStatsBlock(route, html),
    ]);
    expect(failures, JSON.stringify(failures, null, 1)).toEqual([]);
  });

  it("the stats block server-renders its true figures", () => {
    const demo = readFileSync(join(BUILD_DIR, "wishes/demo.html"), "utf-8");
    expect(demo).toContain("58%");
    expect(demo).toContain("£1.27bn");
  });
});
