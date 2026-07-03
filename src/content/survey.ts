/**
 * The market-research survey (v13 — supersedes v11.2/v11.3/v11.4/v12 per the
 * v13 brief; not reconciled with those, built fresh from the brief's spec).
 *
 * Research-integrity rules baked in here:
 * - Neutral wording throughout — the instrument leans Kindled's way only
 *   through TOPIC selection (pains, behaviour, concept intent), never phrasing.
 * - Every would-you-rather pair is side-randomised at render (order bias),
 *   including the calculated Q6 pair.
 * - The objection question is deliberately included.
 * - Results are always labelled as a self-selected sample.
 */

export type SurveyQuestion =
  | { id: string; kind: "single"; text: string; options: string[]; concept?: string }
  | { id: string; kind: "multi"; text: string; options: string[] }
  | { id: string; kind: "wyr"; text: string; a: string; b: string }
  | { id: string; kind: "text"; text: string; placeholder: string }
  | { id: string; kind: "stepper"; text: string; helper?: string; min: number; max: number; start: number; topLabel: string }
  | { id: string; kind: "banded"; text: string; helper?: string; options: { label: string; mid: number }[] };

export const SCREENER = {
  id: "q1_segment",
  text: "Which fits you best?",
  options: [
    { label: "Parent or guardian of under-16s", segment: "parent" },
    { label: "Regular gift-buyer, no kids", segment: "buyer" },
    { label: "Both", segment: "both" },
    { label: "Neither", segment: "neither" },
  ],
} as const;

/** Q4/Q5 share the same bands and midpoints (used in the Q6 calculation). */
export const VALUE_BANDS: { label: string; mid: number }[] = [
  { label: "Under £50", mid: 25 },
  { label: "£50–£100", mid: 75 },
  { label: "£100–£200", mid: 150 },
  { label: "£200–£400", mid: 300 },
  { label: "£400+", mid: 500 },
];

export function bandMidpoint(label: unknown): number {
  return VALUE_BANDS.find((b) => b.label === label)?.mid ?? 0;
}

/** Q16 concept + intent — broadened wording: specific items OR one pooled
 *  goal, funded flexibly, surprise contributions possible on the day. */
export const CONCEPT_PARAGRAPH =
  "One shared link for everyone who loves them. Add the specific things " +
  "they'd genuinely like — big or small — or set one bigger goal for " +
  "everyone to pool toward. People chip in whatever they want, some " +
  "contributions can even land as a surprise on the big day itself, and " +
  "it's all revealed together when it matters.";

/** Q9b — the curated-list concept (parents/both only). */
export const CURATED_LIST_CONCEPT =
  "Imagine building your child's list yourself — the things you know " +
  "they'll actually love or need — then sharing it with grandparents, " +
  "aunts, uncles and friends. As each thing gets bought, it's " +
  "automatically marked off, so nobody doubles up, nobody panics in the " +
  "shop, and your child gets exactly what you know is right for them.";

/** Gift-value calculation engine — v16: used exclusively for the
 *  end-of-survey "power of your wishes" reveal. Q6 itself is now a plain,
 *  non-personalised WYR (no numbers shown mid-survey); the calculation
 *  stays a surprise until the conversion screen. */
export type Tier = "low" | "mid" | "high" | "top";

export function tierFor(twoYearValue: number): Tier {
  if (twoYearValue < 300) return "low";
  if (twoYearValue < 800) return "mid";
  if (twoYearValue < 1500) return "high";
  return "top";
}

/** Exactly three discrete examples per tier (v14: "3 powerful examples"). */
export const TIER_EXAMPLES: Record<Tier, readonly [string, string, string]> = {
  low: ["a great pair of trainers or headphones", "a nice day out", "something you'd never quite treat yourself to"],
  mid: ["a new sofa", "a weekend away", "that course you've been meaning to do"],
  high: ["a hot tub", "a log burner", "a proper long weekend abroad"],
  top: ["a family trip to Disney", "a villa holiday", "a full living-room refit"],
};

export interface GiftProjection {
  oneYearGifts: number;
  oneYearValue: number;
  twoYearGifts: number;
  twoYearValue: number;
  tier: Tier;
}

/** N = people_buying_for_you (Q3, exact int). V_b/V_x = Q4/Q5 band midpoints.
 *  Unbranched (v14): every respondent answers Q3/Q4/Q5, so this is never
 *  null in practice once those three questions are reached. */
export function computeGiftProjection(answers: Record<string, unknown>): GiftProjection | null {
  const n = answers["people_buying_for_you"];
  const bBand = answers["bday_value_band"];
  const xBand = answers["xmas_value_band"];
  if (typeof n !== "number" || typeof bBand !== "string" || typeof xBand !== "string") return null;
  const vb = bandMidpoint(bBand);
  const vx = bandMidpoint(xBand);
  const oneYearGifts = n;
  const oneYearValue = vb + vx;
  const twoYearGifts = n * 2;
  const twoYearValue = (vb + vx) * 2;
  return { oneYearGifts, oneYearValue, twoYearGifts, twoYearValue, tier: tierFor(twoYearValue) };
}

export const QUESTIONS: SurveyQuestion[] = [
  { id: "people_bought_for", kind: "stepper",
    text: "Roughly how many people do you buy gifts for in a typical year?",
    helper: "Think birthdays, Christmas, anniversaries — everyone.",
    min: 0, max: 30, start: 8, topLabel: "30+" },
  { id: "people_buying_for_you", kind: "stepper",
    text: "And roughly how many people buy YOU gifts in a typical year?",
    min: 0, max: 30, start: 6, topLabel: "30+" },
  { id: "bday_value_band", kind: "banded",
    text: "Roughly what's the combined value of gifts you receive at your birthday?",
    helper: "Just a rough guess is perfect.", options: VALUE_BANDS },
  { id: "xmas_value_band", kind: "banded",
    text: "And at Christmas?", options: VALUE_BANDS },
  { id: "wyr_2yr_choice", kind: "wyr",
    text: "Thinking about all the gifts you get in a year, would you rather…",
    a: "A mix of gifts across the year — some spot on, some not quite right",
    b: "Everyone pooling toward one bigger thing you'd actually choose" },
  { id: "wyr_kids_choice", kind: "wyr",
    text: "If you could choose for your kids, which sounds better over the next couple of years?",
    a: "Ten gifts, with everyone in the family left to choose on their own",
    b: "Everyone contributing to that one big, special gift for them" },
  { id: "returns_frequency", kind: "single",
    text: "How often do you end up returning, exchanging, or quietly re-gifting something you were given?",
    options: ["Never", "Occasionally", "Most occasions", "Almost every time"] },
  { id: "asked_frequency", kind: "single",
    text: "How often are you (or your kids) asked what you'd actually like for birthdays or Christmas?",
    options: ["Rarely", "Sometimes", "Often", "Every time"] },
  { id: "duplicate_pain_experienced", kind: "multi",
    text: "Which of these have actually happened to you?",
    options: [
      "My child ended up with the same toy or gift twice",
      "I've bought something, only to find out someone else already got it",
      "A relative or friend asked me last-minute what to buy and I panicked for an answer",
      "I've had to guess, and got it wrong",
      "None of these",
    ] },
  { id: "curated_list_appeal", kind: "single", concept: CURATED_LIST_CONCEPT,
    text: "How appealing does that sound?",
    options: ["Extremely appealing", "Quite appealing", "Not that appealing", "Not for me"] },
  { id: "buy_behaviour", kind: "single",
    text: "When you're buying for someone else, what do you usually do?",
    options: ["Ask them directly", "Ask someone close to them", "Guess based on what I know", "A bit of all three"] },
  { id: "overcompensation", kind: "single",
    text: "When you're not sure what to get someone, do you tend to spend MORE to make up for it?",
    options: ["Yes, often", "Sometimes", "Rarely", "No, never"] },
  { id: "anxiety_level", kind: "single",
    text: "Big multi-person events like Christmas mean buying for lots of people at once. How much does that create anxiety or last-minute panic for you?",
    options: ["None at all", "A little", "Quite a bit", "It stresses me out every year"] },
  { id: "video_appeal", kind: "single",
    text: "Imagine a gift arrived with a short video message from someone who couldn't be there in person. How does that sound?",
    options: ["Love that", "A nice touch", "Not fussed either way", "Not really for me"] },
  { id: "group_gift_method", kind: "single",
    text: "How do you usually handle group gifts?",
    options: ["Cash in a card", "Bank transfers to one organiser", "A collection website", "We don't really do group gifts"] },
  { id: "whipround_worst_bit", kind: "single",
    text: "What's the worst bit of organising one?",
    options: ["Chasing money", "Awkward asking", "Tracking who's paid", "Agreeing the gift", "Nothing, it's fine"] },
  { id: "concept_intent", kind: "single", concept: CONCEPT_PARAGRAPH,
    text: "Would you use this for your next occasion?",
    options: ["Definitely", "Probably", "Not sure", "Probably not"] },
  { id: "appeal", kind: "multi", text: "What appeals most?",
    options: [
      "No more guessing", "One big gift instead of lots of small ones", "The reveal moment",
      "Video messages attached", "No chasing money", "No duplicate gifts",
      "Buyers know exactly what to get", "Being able to add a surprise contribution on the day",
      "Nothing really",
    ] },
  { id: "objection", kind: "multi", text: "What would put you off?",
    options: ["Trusting it with money", "Yet another app or site", "I prefer choosing gifts myself", "Possible fees", "Nothing much"] },
  { id: "open_text", kind: "text", text: "Your worst gift-buying moment, in one line?",
    placeholder: "Optional — one line" },
];

/**
 * The visible sequence (v14: unbranched — every respondent gets the same
 * questions regardless of the Q1 screener answer, so the end-of-survey
 * projection always has the data it needs). The one remaining skip is
 * answer-driven, not identity-driven: asking "what's the worst bit of
 * organising a group gift" to someone who just said they don't do them
 * would be nonsensical, not a persona branch.
 */
export function questionSequence(answers: Record<string, unknown>): SurveyQuestion[] {
  return QUESTIONS.filter((q) => {
    if (q.id === "whipround_worst_bit" && answers["group_gift_method"] === "We don't really do group gifts") return false;
    return true;
  });
}
