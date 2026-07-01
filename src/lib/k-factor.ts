/**
 * K-Factor — the viral-loop analytics engine behind /admin/k-factor.
 *
 * Kindled grows when a contributor to someone else's Fire goes on to start their own.
 * This computes the three loop metrics the growth dashboard tracks, plus the headline
 * viral coefficient K. Pure and unit-tested; the dashboard route just renders these.
 *
 * K = (invitations sent per user) × (conversion rate per invitation). K > 1 ⇒ each
 * cohort more than replaces itself and growth compounds without paid acquisition.
 */

export interface FunnelInputs {
  /** Unique visitors to shared Fire links. */
  visitors: number;
  /** Visitors who created an account. */
  signups: number;
  /** Fires created (pots). */
  potsCreated: number;
  /** Total share actions across all Fires (the invitation volume). */
  shares: number;
  /** People who contributed to someone else's Fire. */
  contributors: number;
  /** Of those contributors, how many started their own Fire. */
  contributorsWhoStarted: number;
}

export interface KFactorReport {
  /** Visitors → signups. */
  conversionRate: number;
  /** Shares per Fire (referral velocity / invitations per pot). */
  referralVelocity: number;
  /** Contributor → host conversion (the compounding step). */
  contributionToStartRatio: number;
  /** Viral coefficient: referralVelocity × conversionRate. */
  kFactor: number;
  /** True when K > 1 (self-sustaining growth). */
  viral: boolean;
}

const ratio = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 1000 : 0);

export function computeKFactor(i: FunnelInputs): KFactorReport {
  const conversionRate = ratio(i.signups, i.visitors);
  const referralVelocity = ratio(i.shares, i.potsCreated);
  const contributionToStartRatio = ratio(i.contributorsWhoStarted, i.contributors);
  const kFactor = Math.round(referralVelocity * conversionRate * 1000) / 1000;
  return {
    conversionRate,
    referralVelocity,
    contributionToStartRatio,
    kFactor,
    viral: kFactor > 1,
  };
}

export const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;

/** The metric cards the dashboard renders, in display order. */
export function kFactorCards(r: KFactorReport): { label: string; value: string; sub: string }[] {
  return [
    { label: "Conversion Rate", value: pct(r.conversionRate), sub: "Visitors → signups" },
    { label: "Referral Velocity", value: r.referralVelocity.toFixed(2), sub: "Shares per Fire" },
    { label: "Contribution → Start", value: pct(r.contributionToStartRatio), sub: "Contributors who start their own Fire" },
    { label: "K-Factor", value: r.kFactor.toFixed(2), sub: r.viral ? "Self-sustaining (K > 1)" : "Below viral threshold" },
  ];
}
