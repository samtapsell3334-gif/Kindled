/**
 * TrustStrip (v8.2b pattern 2) — a slim structure-teal band worn at the exact
 * moments trust is questioned: under the hero, above the payment sheet.
 * Copy comes from claims.ts (never hardcoded); colours are tokens only, so it
 * renders midnight under `legacy` and deep teal under `ember-teal`.
 */

import { Lock } from "lucide-react";
import { TRUST } from "@/content/claims";

export function TrustStrip({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 ${className}`}
      style={{ background: "var(--structure)" }}
    >
      <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--on-structure-soft)" }} aria-hidden />
      <p className="text-center text-[11px] font-semibold leading-snug" style={{ color: "var(--on-structure)" }}>
        {TRUST.items.join(" · ")}
      </p>
    </div>
  );
}
