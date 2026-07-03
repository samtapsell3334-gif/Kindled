/**
 * SINGLE SOURCE OF TRUTH for every public claim (v8 P2.19).
 *
 * Every statistic, product name, and canonical term the site shows lives HERE
 * and only here. All surfaces (homepage, demo, sandbox, films, investor copy)
 * import from this module — a figure that isn't in this file must not appear
 * on the site. Guarded by the banned-terms regression test in
 * src/lib/__tests__/claims-drift.test.ts.
 */

/** Verified research statistics — value + source + year, nothing invented. */
export const STATS = {
  unwantedGiftSpend: {
    value: "£1.27bn",
    label: "spent on unwanted gifts every UK Christmas",
    source: "Finder UK unwanted-gifts research, 2025",
  },
  receivedUnwanted: {
    value: "3 in 5",
    label: "Brits have received an unwanted gift (58% — around 31 million adults)",
    source: "Finder UK unwanted-gifts research, 2025",
  },
  wastePerPerson: {
    value: "£41",
    label: "wasted per person on gifts that missed the mark",
    source: "Finder UK unwanted-gifts research, 2025",
  },
  overspendPressure: {
    // Qualitative by design — no invented percentage.
    line: "Not knowing what to buy is how overspending happens — Mintel found the pressure to get the right gift pushes people past what they meant to spend.",
    source: "Mintel UK gift-buying research",
  },
} as const;

/** The prize draw — one name, one amount, compliance microcopy everywhere. */
export const DRAW = {
  name: "quarterly prize draw",
  amount: "£2,500",
  microcopy: "18+, UK residents only. Free entry route — no purchase necessary.",
  termsHref: "/terms#prize-draw",
} as const;

/** Stored credit — one name, one rate, one scope. */
export const CREDIT = {
  name: "credit",
  line: "2% back in credit on catalogue purchases",
} as const;

/**
 * Canonical object noun (v8.1, founder-confirmed): user-facing name is "wish";
 * internal name stays "pot" (DB tables, event names like pot_created, component
 * identifiers) so the analytics dashboard's history is untouched.
 */
export const NOUN = "wish" as const;
export const NOUN_PLURAL = "wishes" as const;
/** The chip-in verb (v11.1 P0-3): buttons say this, never "Kindle". */
export const VERB_CHIP_IN = "Chip in" as const;
export const STATUS_LABELS = ["Just started", "Warming up", "Almost there", "Fully funded"] as const;

/** The trust strip (v8.2b P0.3) — worn at the exact moments trust is questioned. */
export const TRUST = {
  items: ["Payments by Stripe", "Money held safely until the reveal", "Free to start"],
} as const;

/** Core taglines. */
export const TAGLINES = {
  signoff: "Gifting, reignited.",
  brandLine: "Kindled — where wishes catch light.", // founder-approved 2026-07-02
  nostalgia: "Remember circling the catalogue? Now it's their turn — minus the felt-tip on the coffee table.",
} as const;
