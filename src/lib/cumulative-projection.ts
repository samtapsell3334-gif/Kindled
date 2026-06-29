/**
 * CumulativeProjection — forecasts the value of a Joint Fire over time.
 *
 * A Joint Fire pools two partners' gifting potential toward a shared Major Goal.
 * This service projects the "Total Fire Value" across 1, 2, and 3-year horizons
 * from each partner's average historical contribution per gifting event, applying
 * a modest momentum factor (habit + network growth) so the curve compounds rather
 * than runs flat.
 *
 * NOTE: these are *display-only forecast* figures for the projection UI, not
 * ledger amounts — real balances use Decimal (see fees.ts / schema). Keeping the
 * forecast in `number` avoids Decimal pow/compounding gymnastics.
 */

export interface JointContributor {
  name: string;
  /** Average value this person's side brings per gifting event, in pounds. */
  avgPerEvent: number;
}

export interface GiftingEvent {
  /** e.g. "Birthday", "Christmas", "Anniversary". */
  label: string;
  /** How many times a year this event recurs (normally 1). */
  perYear: number;
}

export interface ProjectionPoint {
  /** Horizon in years (1, 2, 3, …). */
  year: number;
  /** Cumulative number of gifting events funded by the end of this year. */
  events: number;
  /** Cumulative projected Total Fire Value (pounds), rounded to whole pounds. */
  total: number;
}

export interface ProjectionOptions {
  /** Years to project. Default 3. */
  years?: number;
  /**
   * Year-on-year momentum: how much the per-event contribution grows as the
   * habit strengthens and each partner's circle widens. Default 0.10 (10%).
   */
  momentum?: number;
}

/** Per-event value when both partners' sides contribute. */
export function perEventValue(contributors: JointContributor[]): number {
  return contributors.reduce((sum, c) => sum + Math.max(0, c.avgPerEvent), 0);
}

/** Number of gifting events in a single year across the configured calendar. */
export function eventsPerYear(events: GiftingEvent[]): number {
  return events.reduce((sum, e) => sum + Math.max(0, e.perYear), 0);
}

/**
 * Project cumulative Total Fire Value for each year up to `years`.
 *
 * Year k raises `baseAnnual × (1 + momentum)^(k-1)`; the cumulative total is the
 * running sum of those annual amounts.
 */
export function projectCumulative(
  contributors: JointContributor[],
  events: GiftingEvent[],
  opts: ProjectionOptions = {},
): ProjectionPoint[] {
  const years = opts.years ?? 3;
  const momentum = opts.momentum ?? 0.1;
  const perEvent = perEventValue(contributors);
  const evPerYear = eventsPerYear(events);
  const baseAnnual = perEvent * evPerYear;

  const out: ProjectionPoint[] = [];
  let runningTotal = 0;
  for (let k = 1; k <= years; k++) {
    runningTotal += baseAnnual * Math.pow(1 + momentum, k - 1);
    out.push({
      year: k,
      events: evPerYear * k,
      total: Math.round(runningTotal),
    });
  }
  return out;
}

/**
 * Progress (0–1) of the projected value toward a Major Goal at a given horizon.
 * Useful for the Momentum Arc fill.
 */
export function goalProgress(points: ProjectionPoint[], goalValue: number, atYear: number): number {
  if (goalValue <= 0) return 0;
  const point = points.find((p) => p.year === atYear) ?? points[points.length - 1];
  if (!point) return 0;
  return Math.min(1, point.total / goalValue);
}

// ─── Milestone taxonomy ─────────────────────────────────────────────────────────

export type MilestoneCategory = "EXPEDITION" | "FOUNDATION" | "CELEBRATION" | "LEGACY";

export interface CategoryProfile {
  label: string;
  tagline: string;
  /** Typical planning horizon in years (the projection's upper bound). */
  horizon: number;
  /** Category-specific momentum: how fast per-event contribution velocity grows. */
  momentum: number;
}

/**
 * Each milestone category implies a different planning horizon and contribution
 * velocity — Expeditions are funded fast (1–2 yrs, high momentum); Foundations
 * are patient (2–3+ yrs, steady). These also map to a retail intent segment.
 */
export const MILESTONE_PROFILES: Record<MilestoneCategory, CategoryProfile> = {
  EXPEDITION:  { label: "Expedition",  tagline: "Travel & adventure",   horizon: 2, momentum: 0.12 },
  FOUNDATION:  { label: "Foundation",  tagline: "Home & life-building", horizon: 3, momentum: 0.08 },
  CELEBRATION: { label: "Celebration", tagline: "A landmark moment",    horizon: 1, momentum: 0.15 },
  LEGACY:      { label: "Legacy",      tagline: "A gift for the future", horizon: 3, momentum: 0.06 },
};

/** Project a category's full horizon using its weighted momentum. */
export function projectForCategory(
  contributors: JointContributor[],
  events: GiftingEvent[],
  category: MilestoneCategory,
): ProjectionPoint[] {
  const p = MILESTONE_PROFILES[category];
  return projectCumulative(contributors, events, { years: p.horizon, momentum: p.momentum });
}

/**
 * Category-weighted Time-to-Goal, in (fractional) years, for a given goal value.
 * Returns Infinity if the goal is never reached within a 12-year ceiling.
 */
export function timeToGoal(
  contributors: JointContributor[],
  events: GiftingEvent[],
  goalValue: number,
  category: MilestoneCategory,
): number {
  const { momentum } = MILESTONE_PROFILES[category];
  const baseAnnual = perEventValue(contributors) * eventsPerYear(events);
  if (baseAnnual <= 0 || goalValue <= 0) return Infinity;

  let cum = 0;
  for (let year = 1; year <= 12; year++) {
    const prev = cum;
    cum += baseAnnual * Math.pow(1 + momentum, year - 1);
    if (cum >= goalValue) {
      const frac = (goalValue - prev) / (cum - prev); // linear within the year
      return year - 1 + frac;
    }
  }
  return Infinity;
}
