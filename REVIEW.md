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

## P4 — Polish, SEO & instrumentation
- **P4.2** Custom 404 (`not-found.tsx`): on-brand ember styling, routes home / to the demo.
  (Pinch-zoom, reduced-motion, alt text, lazy-loading were done in the prior overhaul.)
- **P4.3** SEO/shareability: `robots.ts` (disallow /api, /admin, /investor), `sitemap.ts`
  (5 public pages), per-page metadata + OpenGraph/Twitter for the homepage (root layout,
  en_GB) and the demo (`pots/demo/layout.tsx`). TODO(founder): real 1200×630 OG image —
  none generated per the asset guardrail.
- **P4.4** Analytics: new consent-gated layer (`src/lib/analytics.ts` → sendBeacon →
  `POST /api/track`, console/Vercel-logs sink for now; durable sink = founder TODO).
  Fires ONLY when the consent banner choice is "all" (PECR). No third-party SDK — logged
  as the no-new-heavy-deps justification. **Event schema:**
  `{ event, props?, ts, path, session }` with canonical names: `waitlist_viewed`,
  `waitlist_submitted`, `demo_opened`, `pot_chip_in_started`, `pot_chip_in_completed`,
  `reveal_viewed`, `stack_chosen`, `catalogue_item_circled`, `parent_approval_action`,
  `would_you_rather_interaction`, `investor_unlocked`. Wired now: waitlist viewed/
  submitted, demo_opened, pot_chip_in_completed, reveal_viewed (both entry paths),
  investor_unlocked (route + demo surfaces). The rest are reserved names for the P3
  features when built.

## Final verification (recorded before merge)
- Build passes (22 routes; /api/track, robots.txt, sitemap.xml new).
- Grep: 0 mixed pairings ("light a pot"/"fill a fire"/"stoke pot"); 0 "premium AI
  reveal/video" revenue mentions; 0 `href="#"`; 0 PIN identifiers in `.next/static`;
  0 "Booster Draw" in user-facing copy.
- Counters default to real values (CountUpStat `useState(target)`).
- Reduced motion honoured: global CSS rule + useReducedMotion on all Framer loops incl.
  the new StackSection bars.
- Smoke test on dev server: /pots/demo 200; unknown route → custom 404; robots.txt
  disallows /investor; sitemap.xml 200. Investor tabs verified by click-through earlier.
- Deferred to follow-up passes (scoped in PLAN.md + TODO-FOUNDER.md): P3.1 kids' circle
  mode, P3.2 receiver-DOM restructure + add-gift move, P3.3 explainer replacement,
  P4.1 full multi-hat sweep, Lighthouse score capture (needs local Chrome run).

---

# Sandbox MVP v4.1 (branch feat/sandbox-mvp-v4)

## Core + WS-A/B/C/D + WS-E/F minimal (this pass)
- **Entities & store** (`src/lib/sandbox/`): simulated-money model (integer pounds),
  unguessable share slugs + private manager keys (guest-first, no passwords/emails —
  guardrail 3), append-only event log, 3 seeded pots (child birthday + star chart,
  adult joint log-burner, friends leaving gift), exact reset. Persistence adapter:
  in-memory now; Prisma/Postgres path activates when DATABASE_URL exists (PLAN.md).
- **Guardrail 1 in code**: no Stripe test keys present → pure-frontend simulation per
  the decision rule. Payment sheet uses READ-ONLY pre-filled dummy card values that are
  never read or transmitted; fake Apple Pay button; "Demo — no money moves" badge.
  Server-side stripCardData + assertNoCardData; verified end-to-end by injecting
  cardNumber/cvc into a contribution payload — nothing card-like reached the store/log.
- **Guardrail 6 server-side**: viewFor() builds viewer payloads; receiver-surprise API
  response verified to contain no amounts, contributors, or message content.
- **Flows**: /sandbox (create: occasion→date→who→parent/guardian toggle→star chart→
  list w/ category/retailer/price-band capture→surprise→share+manager links);
  /p/[slug] (guest view+poll, chip-in, simulated sheet, text/video message via
  KindleRecord, thank-you conversion moment with "Would you rather?" + ref-chained
  start-your-own; manager panel with receiver preview + Simulate reveal day →
  gift card (fake voucher + simulated commission)/product/stack).
- **WS-F dashboard** (/sandbox/dashboard, shared-secret): 5 panels off the real event
  log — intent (category/retailer/price band), funnel with rates, K-factor (defined
  on-screen, honestly labelled sandbox sample), reveal economics (simulated commission),
  engagement (message types, WYR split). CSV export per panel.
- **Events (WS-G)**: pot_created, item_added, pot_viewed, contribution_started,
  payment_sheet_viewed, contribution_completed, message_added, wyr_answered,
  reveal_triggered, reveal_outcome. No card data, no message content, no child
  identifiers in events.
- **Tests**: the 3 mandated tests + loop coverage = 10 new (87 repo-wide), all passing.
- **E2E verified** (dev server, API level): create → contribute (+card-injection
  attempt) → receiver redaction → ref-chained second pot → reveal → commission →
  event spine + dashboard 200s.

## Honestly not done yet (sequenced next, not skipped)
- v4.1: video persistence beyond object URLs (needs Blob/DB), per-session abuse caps,
  Stripe test mode path, on-phone iOS/Android script runs, staging deploy decision.
- v5 (reveal experience) + v6 (films): NOT STARTED — both depend on this branch; each
  needs its own focused pass. Logged with dependencies in PLAN.md.

---

# Reveal Experience v5 (branch feat/reveal-v5)

## WS-R1/R2/R3a/R4 + R3 (partial)
- **RevealExperience** (`src/components/RevealExperience.tsx`): explicit beat machine
  SEALED → TAP → IGNITION → NUMBER → PEOPLE → WORDS → FACES → GIFT → (OPTIONS) →
  SHARE. Tap-to-advance (words/faces page via their own taps — a region tap cannot
  skip them; bug found in verification and fixed), Skip + Replay, sr-only aria-live
  beat announcements, mute persisted to localStorage.
- **Ignition (WS-R2)**: exported reusable canvas ember system — upward drift, warm
  palette, hand-drawn wobble; no DOM particles, no stock confetti, no flashes
  (photosensitivity-safe by construction).
- **Audio (WS-R3a)**: WebAudio-SYNTHESISED strike/whoosh/swell/tick — original by
  construction, zero copyright exposure. Starts on the ritual tap only; ducking N/A
  until an underscore exists. TODO-FOUNDER: commissioned signature sound slots in.
- **Haptics**: Vibration API, feature-detected (sealed pulse, ignition triple-tick,
  number thump).
- **Kid pots**: star celebration in the gift beat, wholesome copy, no countdown.
- **Options (WS-R4)**: full/partial branch with equal-weight choices; stack
  projection uses real pot maths (verified: £40/£130 → "starts the next pot at 31%").
  Partial funding celebrated as what was RAISED.
- **Share engine (WS-R3, partial)**: canvas-generated 9:16 share card (embers, total,
  people, recipient, referral link) → native share/download; reaction capture (30s,
  consent copy, delete/re-record via KindleRecord); thank-you broadcast. Events:
  reaction_recorded, share_clip_generated, share_completed, thankyou_broadcast_sent.
  NOT built (honest): auto-stitched video clip (client-side canvas+MediaRecorder
  stitching is its own project) — TODO-FOUNDER with the share card covering the need.
- **Security finding fixed during build**: the organiser's live ceremony needs sealed
  messages unsealed at the moment of reveal — added a manager-key-authorised
  `?unseal=1` (dashboard stays sealed; guests cannot unseal; verified all three).
- **Verified in-browser**: all nine beats in order, no-skip on words, gift-card
  outcome → simulated commission event (£2 = 5% of £40), thank-you event, share beat
  screenshot on record. Big-screen/QR mode + captions field: TODO-FOUNDER.

---

# Explainer Film System v6 (branch feat/explainer-v6)

- **Pipeline (WS-V1)**: code-played films via a data-driven FilmPlayer (Remotion
  rejected for this environment — decision + rationale in PLAN.md). Captions-first:
  the caption bar is always on; both films land fully muted today. Brand-system
  visuals only; the v5 Ignition opens both films. No TTS, no stock/gen footage, no
  music of any kind shipped (nothing to licence — REVIEW note: zero audio assets used;
  the VO + signature underscore are founder TODOs with pre-built slots).
- **WS-V2 Investor Film**: scripts/investor-film.md (7 scenes, 90s, every figure
  matches the investor page; use-of-funds bars carry a visible "placeholder — founder
  to confirm" label). Scenes live INSIDE investor-content.json → served only by
  /api/investor after PIN. Bundle grep: film data absent from all client chunks (the
  only hit is the section label string in component code). Rendered as "Watch the
  90-second brief" directly under the elevator pitch.
- **WS-V3 Customer Film**: scripts/customer-film.md (60s + two 9:16 vertical-cut
  scripts). Public /film page: self-hosted player, captions on, transcript below,
  waitlist + demo CTAs. Verified playing in-browser with the caption bar.
- **WS-V4 Placement**: homepage footer "Watch the film" link; /film in the sitemap;
  investor film absent from public routes/sitemap/bundle. Events wired via the
  consent-gated layer: film_played, film_completed.
- **VO-RECORDING-GUIDE.md**: exact-timed scripts, pacing marks, phone-mic guidance,
  drop-in file paths (with a note that gated investor VO should be served via
  /api/investor if confidentiality requires).
- **Honest deltas**: MP4/9:16 renders are a mechanical founder step (scripts +
  player are the source of truth); film_shared event awaits a share affordance.

---

# Founder-TODO execution pass (expert decisions, 2026-07-01)
- **Rate limiting**: /api/investor (8/10min/IP) + /api/sandbox/admin (20/10min/IP) via
  new src/lib/rate-limit.ts. Serverless caveat documented in-file (per-lambda buckets;
  hard global ceiling arrives with Postgres).
- **Production secrets set** (Vercel env): INVESTOR_PIN (random, off the dev fallback),
  SANDBOX_ADMIN_SECRET (strong random), SANDBOX_COMMISSION_PCT=5 (expert: mid-range of
  typical UK B2B gift-card discounts), NEXT_PUBLIC_DEMO_MODE=1.
- **Vercel Blob provisioned via API**: store "kindled-media" created, connected to the
  kindledkindled project (BLOB_READ_WRITE_TOKEN auto-injected, all envs),
  NEXT_PUBLIC_BLOB_ENABLED=1 → Memory/video uploads become durable on this deploy.
- **OG image**: code-rendered opengraph-image.tsx (no binary assets), deterministic
  ember field, brand palette.
- **Demo → sandbox cross-link** added in the demo waitlist card.
- **Still genuinely founder-only**: DATABASE_URL (marketplace terms + billing → not
  accepted on your behalf), VO recording, commissioned audio, use-of-funds split,
  gift-card rates, legal [TODO]s, citation verification, on-phone test runs.
