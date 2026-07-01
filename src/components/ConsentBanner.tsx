"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

/**
 * ConsentBanner — PECR/UK-GDPR-aware cookie consent, privacy-first by default.
 *
 * Non-essential cookies are OFF unless the visitor explicitly accepts. Closing the
 * banner without choosing is treated as "essential only" (no implied consent). The
 * choice is stored locally; wire real analytics/marketing scripts to only load when
 * `kindled-consent === "all"`.
 */
const KEY = "kindled-consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* storage blocked — don't nag */
    }
  }, []);

  function choose(value: "all" | "essential") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
    // TODO(founder): when analytics/marketing tags are added, load them here only if value === "all".
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Cookie className="h-4 w-4 text-amber-700" />
          </span>
          <p className="text-[13px] leading-relaxed text-stone-600">
            We use essential cookies to make Kindled work. With your consent we&apos;d also use optional
            cookies to understand how the site is used. See our{" "}
            <Link href="/privacy" className="font-semibold text-stone-800 underline underline-offset-2">
              Privacy&nbsp;Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:ml-auto">
          <button
            onClick={() => choose("essential")}
            className="flex-1 whitespace-nowrap rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-stone-700 transition-colors hover:bg-stone-50 sm:flex-none"
          >
            Essential only
          </button>
          <button
            onClick={() => choose("all")}
            className="flex-1 whitespace-nowrap rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-[13px] font-bold text-stone-900 transition-transform hover:scale-[1.03] sm:flex-none"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
