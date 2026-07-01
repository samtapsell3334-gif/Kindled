# REVIEW — Master Brief v3 change log

Every change, with the why. Newest at the bottom. See PLAN.md for the audit and
TODO-FOUNDER.md for open assumptions.

## Phase 0 (audit only — no code)
All ten audit checklist items verified DONE from the prior overhaul (evidence in
PLAN.md). No P0 code work required; P0.1–P0.3 acceptance checks re-verified:
no `href="#"`, draw terms reachable from every mention, money section present on
homepage + terms anchor.

## P1 — Investor page
- **P1.1** Elevator pitch block at the top of the war-room hero: problem → solution →
  wedge → moat → ask, one-tap "Copy pitch" (clipboard + Copied state). Uses only
  on-site-confirmed figures (£3.2bn sourced; £250k ask per brief). No buzzwords.
- **P1.2** Removed the "Premium AI Reveals" revenue line; replaced with **Gift Card
  Commissions** (mechanism + why-attractive; rates → TODO-FOUNDER). Sweep confirmed the
  only other "AI video" strings are feature code comments, not revenue claims.
- **P1.3** Revenue models reframed two-phase: Phase 1 gift cards + catalogue commissions
  (each: how it works + why now, one sentence each); Phase 2 Retail Media. Heading
  "Phase 1 revenue — three pillars" → "Revenue — how it phases". Roadmap already a
  two-phase timeline ("Build the Loop" / "Sell the Signal").
- **P1.4** Clean-room paragraph + 3-step path visual in the Edge tab, explicitly labelled
  roadmap ("No clean-room partnership exists today").
- **P1.5** Trojan-horse GTM in the Mechanism tab, leading into the existing flywheel
  diagram: wedge / conversion / snowball / CAC-logic cards. "Would you rather?" labelled
  roadmap. No invented conversion numbers.
- **P1.6** Competitive landscape in Edge tab: cash-in-card, bank transfer/Monzo, collection
  pots, retailer wishlists, registries — capability coords on honest axes + "why we win".
- **P1.7** Behaviour-change thesis: 4 rows (current → new → lever → why it sticks), with the
  Mintel 2025 finding used qualitatively (no invented percentage).
- **Verified:** build passes; PIN entry → all five sections render in the correct tabs;
  bundle grep: pitch content and PIN absent from client chunks (one "1066" hit was a CSS
  easing decimal `0.991066` — false positive, inspected).

## P2 — Conversion & messaging (public site)
- **P2.1** Metaphor clash fixed: "Be Among the First to Light a Pot" → "Start a Pot";
  "Stoke & Win" → "Chip In & Win". Rule enforced: pot verbs for functional copy, fire as
  brand flavour only ("Slide to ignite" on reveal moments retained deliberately).
  Sweep also caught two WS1 leftovers: "£2,500 Summer Goal Booster Draw" and "Goal
  Booster Draw" strings → "quarterly prize draw" + free-entry note. Verify grep: zero
  mixed pairings, zero orphaned draw names in copy (comments/CSS class names ignored).
- **P2.2** Already DONE (Phase 0) — waitlist primary, honest labels, demo pill.
- **P2.3** Friends + family framing: hero badge, hero sub-headline ("friends, family and
  everyone in between"), Problem intro (leaving-dos added), Features lead, site title +
  meta description. Family remains the anchor. Friends demo pot deferred → TODO-FOUNDER
  (belongs in the adult-receiver restructure).
- **P2.4** Reveal truth made explicit: homepage RevealPreview now says the reveal happens
  on the day you set, "not just when the pot is full"; HowMoneyWorks point 3 lists the
  three generous choices (take it / stack forward / switch goal); demo "when your pots are
  fully funded" line reworded. Verify grep: no copy implies reveal-only-when-full.
- **P2.5** Mintel beat added under the Problem stats, qualitative, correctly attributed
  (Mintel UK Gift Purchasing Journey Report 2025), no invented percentage.
- **P2.6** Stack as a hero feature: new homepage StackSection ("Big dreams take more than
  one birthday") with a 3-stage animated visual (birthday 45% → Christmas 82% → fully
  funded), reduced-motion static fallback; partial-funding choice connected to P0.3/P2.4;
  demo arcade pot now explicitly mid-stack ("Carried over from his birthday").
- **Verified:** build passes; friends/Mintel/Stack all render on the dev server. (One
  incident: running the prod build while the dev server shared .next corrupted the dev
  cache → restart fixed; no code issue.)
