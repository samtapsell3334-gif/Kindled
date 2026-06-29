/**
 * StarEngine — the "1/30th" goal-linked progress engine behind the Star Chart.
 *
 * A Fire's Major Goal is divided into exactly 30 stars. Each star is worth
 * `goalValue / 30`. Children earn stars by completing parent-approved Behaviors;
 * every awarded star adds its value to the Fire's PotValue.
 *
 * IMPORTANT: PotValue is the single source of truth for financial progress. The
 * 30-star grid is purely a *front-end view* of that value — this engine always
 * derives `potValue` from `starsFilled × starValue`, so the two can never drift.
 * Every award appends an immutable audit entry (which behaviour filled which
 * stars, and the £ it added) for parent transparency.
 *
 * These are display-layer figures (number). Ledger/settlement amounts live on the
 * Prisma models as Decimal (see schema.prisma `Pot`, `Behavior`, `StarAward`).
 */

/** A goal is always divided into this many stars. */
export const STAR_COUNT = 30;

export interface Behavior {
  id: string;
  description: string;
  /** Stars granted each time this behaviour is completed. */
  starsAwarded: number;
  /** Routine behaviours (chores) can be completed repeatedly; one-offs cannot. */
  isRecurring: boolean;
}

/** One immutable line in the transparency audit log. */
export interface StarAward {
  id: string;
  behaviorId: string;
  behaviorDescription: string;
  /** Stars actually filled by this award (after clamping to the 30 ceiling). */
  starsAwarded: number;
  /** Pounds this award added to PotValue (starsAwarded × starValue). */
  valueAdded: number;
  /** First star slot (0-indexed) this award filled — drives the grid highlight. */
  starIndexStart: number;
  timestamp: number;
}

export interface StarChartState {
  /** The Fire's Major Goal value, in pounds. */
  goalValue: number;
  /** How many of the 30 stars are filled (0–30). */
  starsFilled: number;
  /** Single source of truth: cumulative pounds earned = starsFilled × starValue. */
  potValue: number;
  auditLog: StarAward[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Value of a single star = goalValue / 30. Recompute whenever goalValue changes;
 * `setGoalValue` does this and re-derives PotValue so nothing drifts.
 */
export function calculateStarValue(goalValue: number, starCount: number = STAR_COUNT): number {
  if (starCount <= 0 || goalValue <= 0) return 0;
  return round2(goalValue / starCount);
}

export function isGoalUnlocked(state: StarChartState): boolean {
  return state.starsFilled >= STAR_COUNT;
}

/** Progress toward the goal, 0–1, for the fill ring / bar. */
export function starProgress(state: StarChartState): number {
  return Math.min(1, state.starsFilled / STAR_COUNT);
}

/** Build a fresh chart for a goal, optionally pre-seeded with earned stars. */
export function createChart(goalValue: number, starsFilled = 0): StarChartState {
  const filled = Math.max(0, Math.min(STAR_COUNT, starsFilled));
  return {
    goalValue,
    starsFilled: filled,
    potValue: round2(filled * calculateStarValue(goalValue)),
    auditLog: [],
  };
}

/**
 * Change the Major Goal value. Star value is recomputed, and because PotValue is
 * derived (starsFilled × starValue) it updates automatically — no drift.
 */
export function setGoalValue(state: StarChartState, goalValue: number): StarChartState {
  return {
    ...state,
    goalValue,
    potValue: round2(state.starsFilled * calculateStarValue(goalValue)),
  };
}

/**
 * Award a completed behaviour: fills its stars (clamped to the 30 ceiling),
 * re-derives PotValue from the new filled count, and appends an audit entry.
 * A no-op (returns the same state) once the chart is full.
 */
export function awardBehavior(
  state: StarChartState,
  behavior: Behavior,
  now: number = Date.now(),
): StarChartState {
  const starValue = calculateStarValue(state.goalValue);
  const start = state.starsFilled;
  const filledNow = Math.min(STAR_COUNT - start, Math.max(0, Math.floor(behavior.starsAwarded)));
  if (filledNow === 0) return state;

  const starsFilled = start + filledNow;
  const entry: StarAward = {
    id: `award_${now}_${behavior.id}_${start}`,
    behaviorId: behavior.id,
    behaviorDescription: behavior.description,
    starsAwarded: filledNow,
    valueAdded: round2(filledNow * starValue),
    starIndexStart: start,
    timestamp: now,
  };
  return {
    ...state,
    starsFilled,
    potValue: round2(starsFilled * starValue), // derived — single source of truth
    auditLog: [entry, ...state.auditLog],
  };
}

/** Award N ad-hoc stars (e.g. a parent tapping a star slot directly). */
export function awardStars(
  state: StarChartState,
  count: number,
  label = "Manual star",
  now: number = Date.now(),
): StarChartState {
  return awardBehavior(
    state,
    { id: "manual", description: label, starsAwarded: count, isRecurring: false },
    now,
  );
}

/** Default routine behaviours a parent can toggle on for a child's chart. */
export const DEFAULT_BEHAVIORS: (Behavior & { enabled: boolean })[] = [
  { id: "homework", description: "Homework finished", starsAwarded: 2, isRecurring: true, enabled: true },
  { id: "tidy", description: "Tidied bedroom", starsAwarded: 1, isRecurring: true, enabled: true },
  { id: "teeth", description: "Brushed teeth", starsAwarded: 1, isRecurring: true, enabled: true },
  { id: "chores", description: "Helped with chores", starsAwarded: 2, isRecurring: true, enabled: true },
  { id: "reading", description: "Read for 20 mins", starsAwarded: 1, isRecurring: true, enabled: false },
  { id: "kind", description: "Kind to a sibling", starsAwarded: 1, isRecurring: true, enabled: false },
];
