/**
 * Complement + alternatives map (v11 WS-3) — SANDBOX STUB for the future
 * recommendation engine. A simple category-pair table: paste a razor, see two
 * comparable razors at other price points plus "goes well together: a
 * post-shave scalp moisturiser". Nothing here is personalised or learned.
 */

export interface SuggestedItem { name: string; price: number; category: string; retailer: string }

interface PairRule {
  match: RegExp;
  alternatives: SuggestedItem[]; // same category, other price points
  complement: SuggestedItem;     // "goes well together" — a small, easily granted wish
  line: string;
}

export const PAIR_RULES: PairRule[] = [
  {
    match: /razor|shav/i,
    alternatives: [
      { name: "Classic safety razor kit", price: 28, category: "Grooming", retailer: "Boots" },
      { name: "Premium electric head shaver", price: 89, category: "Grooming", retailer: "John Lewis" },
    ],
    complement: { name: "Post-shave scalp moisturiser", price: 12, category: "Grooming", retailer: "Boots" },
    line: "Goes well together: a post-shave scalp moisturiser — small wish, easily granted.",
  },
  {
    match: /telescope/i,
    alternatives: [
      { name: "Starter tabletop telescope", price: 55, category: "Science", retailer: "Argos" },
      { name: "Computerised go-to telescope", price: 320, category: "Science", retailer: "John Lewis" },
    ],
    complement: { name: "Star atlas for beginners", price: 15, category: "Books", retailer: "Waterstones" },
    line: "Goes well together: a star atlas — small wish, easily granted.",
  },
  {
    match: /coffee|espresso/i,
    alternatives: [
      { name: "Cafetière and grinder set", price: 35, category: "Kitchen", retailer: "John Lewis" },
      { name: "Bean-to-cup coffee machine", price: 349, category: "Kitchen", retailer: "Currys" },
    ],
    complement: { name: "Three-month beans subscription", price: 24, category: "Kitchen", retailer: "Pact Coffee" },
    line: "Goes well together: a beans subscription — small wish, easily granted.",
  },
  {
    match: /trainer|running shoe/i,
    alternatives: [
      { name: "Everyday road trainers", price: 60, category: "Sports", retailer: "Sports Direct" },
      { name: "Carbon-plate race shoes", price: 210, category: "Sports", retailer: "Runners Need" },
    ],
    complement: { name: "Technical running socks (3-pack)", price: 14, category: "Sports", retailer: "Decathlon" },
    line: "Goes well together: proper running socks — small wish, easily granted.",
  },
  {
    match: /console|playstation|xbox|nintendo switch/i,
    alternatives: [
      { name: "Handheld retro console", price: 45, category: "Games", retailer: "Argos" },
      { name: "Current-gen console bundle", price: 429, category: "Games", retailer: "Game" },
    ],
    complement: { name: "Extra controller", price: 45, category: "Games", retailer: "Game" },
    line: "Goes well together: an extra controller — small wish, easily granted.",
  },
  {
    match: /tent|camping/i,
    alternatives: [
      { name: "Two-person weekend tent", price: 49, category: "Outdoors", retailer: "Decathlon" },
      { name: "Four-person family tent", price: 179, category: "Outdoors", retailer: "Go Outdoors" },
    ],
    complement: { name: "Rechargeable camping lantern", price: 18, category: "Outdoors", retailer: "Decathlon" },
    line: "Goes well together: a camping lantern — small wish, easily granted.",
  },
  {
    match: /keyboard/i,
    alternatives: [
      { name: "Compact mechanical keyboard", price: 55, category: "Tech", retailer: "Amazon" },
      { name: "Premium low-profile mechanical board", price: 145, category: "Tech", retailer: "John Lewis" },
    ],
    complement: { name: "Cushioned wrist rest", price: 16, category: "Tech", retailer: "Amazon" },
    line: "Goes well together: a wrist rest — small wish, easily granted.",
  },
  {
    match: /air fryer/i,
    alternatives: [
      { name: "Compact 4L air fryer", price: 49, category: "Kitchen", retailer: "Argos" },
      { name: "Dual-drawer family air fryer", price: 129, category: "Kitchen", retailer: "Currys" },
    ],
    complement: { name: "Air-fryer cookbook", price: 12, category: "Books", retailer: "Waterstones" },
    line: "Goes well together: an air-fryer cookbook — small wish, easily granted.",
  },
  {
    match: /bike|cycle/i,
    alternatives: [
      { name: "Hybrid commuter bike", price: 260, category: "Sports", retailer: "Halfords" },
      { name: "Kids' first pedal bike", price: 120, category: "Sports", retailer: "Halfords" },
    ],
    complement: { name: "Rechargeable bike light set", price: 20, category: "Sports", retailer: "Halfords" },
    line: "Goes well together: a bike light set — small wish, easily granted.",
  },
  {
    match: /headphone|earbud/i,
    alternatives: [
      { name: "Wireless on-ear headphones", price: 59, category: "Tech", retailer: "Argos" },
      { name: "Noise-cancelling over-ears", price: 249, category: "Tech", retailer: "John Lewis" },
    ],
    complement: { name: "Hard travel case", price: 13, category: "Tech", retailer: "Amazon" },
    line: "Goes well together: a travel case — small wish, easily granted.",
  },
];

export function suggestionsFor(title: string): { alternatives: SuggestedItem[]; complement: SuggestedItem; line: string } | null {
  const rule = PAIR_RULES.find((r) => r.match.test(title));
  return rule ? { alternatives: rule.alternatives, complement: rule.complement, line: rule.line } : null;
}
