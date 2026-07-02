/**
 * The market-research survey (v11 WS-14).
 *
 * Research-integrity rules baked in here:
 * - Neutral wording throughout — the instrument leans Kindled's way only
 *   through TOPIC selection (pains, behaviour, concept intent), never phrasing.
 * - Every would-you-rather pair is side-randomised at render (order bias).
 * - The objection question (Q15) is deliberately included.
 * - Results are always labelled as a self-selected sample.
 */

export type SurveyQuestion =
  | { id: string; kind: "single"; text: string; options: string[]; parentsOnly?: boolean }
  | { id: string; kind: "multi"; text: string; options: string[] }
  | { id: string; kind: "wyr"; text: string; a: string; b: string; parentsOnly?: boolean }
  | { id: string; kind: "text"; text: string; placeholder: string };

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

export const CONCEPT_PARAGRAPH =
  "One link where friends and family chip into a chosen gift for someone. " +
  "Amounts stay private, messages and videos are attached, and everything " +
  "stays secret until it's revealed on the day.";

export const QUESTIONS: SurveyQuestion[] = [
  { id: "q2_group_gifts", kind: "single", text: "How do you usually handle group gifts?",
    options: ["Cash in a card", "Bank transfers to one organiser", "A collection website", "We don't really do group gifts"] },
  { id: "q3_chip_in", kind: "single", text: "How much would you typically chip in to a group gift?",
    options: ["£5–10", "£10–20", "£20–50", "£50+"] },
  { id: "q4_last_48", kind: "single", text: "How often do you end up buying a gift in the final 48 hours?",
    options: ["Rarely", "Sometimes", "Often", "Basically always"] },
  { id: "q5_panic", kind: "single", text: "Have you ever panicked about what to buy someone?",
    options: ["Never", "Sometimes", "Often", "Every occasion"] },
  { id: "q6_overspend", kind: "single", text: "When you're not sure what to get, do you spend more to make up for it?",
    options: ["Yes, often", "Sometimes", "No"] },
  { id: "q7_landed", kind: "single", text: "Think of the last few gifts you gave. How many really landed?",
    options: ["All", "Most", "Some", "Honestly, no idea"] },
  { id: "q8_whipround", kind: "single", text: "Ever organised a group collection (a whip-round)?",
    options: ["Yes", "No"] },
  { id: "q8b_worst_bit", kind: "single", text: "What was the worst bit?",
    options: ["Chasing money", "Awkward asking", "Tracking who paid", "Agreeing the gift", "Nothing, it was fine"] },
  { id: "q9_wyr_surprises", kind: "wyr", text: "Would you rather…",
    a: "Five £20 surprises", b: "One £100 thing you actually wanted" },
  { id: "q10_wyr_child", kind: "wyr", parentsOnly: true, text: "For your child, would you rather…",
    a: "They unwrap ten small toys", b: "Everyone chips into the one big thing they'll remember" },
  { id: "q11_wyr_card", kind: "wyr", text: "Would you rather…",
    a: "Send a gift card", b: "Chip into a chosen gift with a video message attached" },
  { id: "q12_wyr_time", kind: "wyr", text: "Would you rather…",
    a: "Three hours guessing in shops", b: "Three minutes chipping in online" },
  { id: "q13_concept", kind: "single", text: "Would you use this for your next occasion?",
    options: ["Definitely", "Probably", "Not sure", "Probably not"] },
  { id: "q14_appeal", kind: "multi", text: "What appeals most?",
    options: ["No more guessing", "One big gift instead of lots of small ones", "The reveal moment", "Video messages", "No chasing money", "Nothing really"] },
  { id: "q15_objection", kind: "multi", text: "What would put you off?",
    options: ["Trusting it with money", "Yet another app or site", "I prefer choosing gifts myself", "Possible fees", "Nothing much"] },
  { id: "q16_worst_moment", kind: "text", text: "Your worst gift-buying moment, in one line?",
    placeholder: "Optional — one line" },
];

/** The visible sequence for a given state (branching lives here, tested). */
export function questionSequence(answers: Record<string, unknown>, segment: string | null): SurveyQuestion[] {
  return QUESTIONS.filter((q) => {
    if (q.id === "q8b_worst_bit" && answers["q8_whipround"] !== "Yes") return false;
    if ("parentsOnly" in q && q.parentsOnly && segment !== "parent" && segment !== "both") return false;
    return true;
  });
}
