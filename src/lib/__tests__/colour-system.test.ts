import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * v8.2 colour-system guards:
 *  1. Theme parity — both registers define exactly the same token names.
 *  2. AA contrast matrix — the ember-teal pairs the brief calls out explicitly.
 *  3. --night stays a set-piece: only reveal/share/OG/film surfaces may use it.
 *  4. Token components carry no raw hex (the v8.2 CI raw-hex rule, enforced on
 *     the token-only file list; grows as surfaces convert).
 */

const css = readFileSync("src/app/globals.css", "utf-8");

function tokensOf(block: string): string[] {
  const m = css.match(block === "legacy" ? /\[data-theme="legacy"\] \{([^}]+)\}/ : /\[data-theme="ember-teal"\] \{([^}]+)\}/);
  return [...(m?.[1] ?? "").matchAll(/--[\w-]+(?=:)/g)].map((x) => x[0]).sort();
}

// WCAG relative luminance / contrast ratio.
function lum(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const ratio = (a: string, b: string) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
};

describe("v8.2 colour system", () => {
  it("legacy and ember-teal define identical token sets", () => {
    const a = tokensOf("legacy");
    const b = tokensOf("ember-teal");
    expect(a.length).toBeGreaterThan(10);
    expect(a).toEqual(b);
  });

  it("ember-teal AA contrast matrix holds", () => {
    const pairs: [string, string, string, number][] = [
      // [name, fg, bg, minimum]
      ["CTA dark-amber ink on ember fill", "#412402", "#EF9F27", 4.5],
      ["mint secondary text on structure teal", "#9FE1CB", "#085041", 4.5],
      ["cream text on structure teal", "#E1F5EE", "#085041", 4.5],
      ["ink on cream ground (small sizes)", "#2C2C2A", "#FAF5EB", 7],
      ["soft ink on cream ground", "#5F5E5A", "#FAF5EB", 4.5],
      ["structure-mid links on cream", "#0F6E56", "#FAF5EB", 4.5],
      ["cream text on footer night step", "#E1F5EE", "#04342C", 7],
      ["mint on footer night step", "#9FE1CB", "#04342C", 4.5],
    ];
    const failures = pairs
      .map(([name, fg, bg, min]) => ({ name, r: ratio(fg, bg), min }))
      .filter((p) => p.r < p.min);
    expect(failures, JSON.stringify(failures)).toEqual([]);
  });

  it("--night is used only on reveal/share/OG/film set-piece surfaces", () => {
    const allowed = new Set([
      "src/components/RevealExperience.tsx",
      "src/components/RevealOverlay.tsx",
      "src/components/GeneratedReveal.tsx",
      "src/app/p/[slug]/page.tsx", // receiver teaser + granted celebration panels
      "src/app/globals.css",
      "src/lib/theme.ts",
      "src/lib/__tests__/colour-system.test.ts",
    ]);
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const full = join(dir, f);
        if (statSync(full).isDirectory()) { if (!/node_modules/.test(full)) walk(full); continue; }
        if (!/\.(tsx?|css)$/.test(f)) continue;
        if (/var\(--night\)|bg-night/.test(readFileSync(full, "utf-8")) && !allowed.has(full)) hits.push(full);
      }
    };
    walk("src");
    expect(hits).toEqual([]);
  });

  it("token components carry no raw hex (v8.2 CI rule, enforced list)", () => {
    const tokenOnly = ["src/components/TrustStrip.tsx"];
    for (const f of tokenOnly) {
      const body = readFileSync(f, "utf-8");
      expect(body.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [], f).toEqual([]);
    }
  });
});
