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

---

# Consistency v8 — One Site, One Truth (merged cae9984)

- Audit-confirmed the external findings first: several were already fixed mid-flight
  (status labels, dates, personas, counters, draw/credit naming, anchors partly,
  investor gating, viewport). The REAL leftovers were in GiftingImpactPanel (five
  unverified stats incl. £3.2B/YouGov/WRAP/MaPS), FirstKindlersCTA copy, a stale demo
  sources line, investor-JSON traction/opportunity stats, one dead footer anchor, and
  missing /sandbox metadata — all fixed (see commit 89be669 for the full list).
- **Single source of truth:** `src/content/claims.ts` — every statistic (+source),
  draw, credit, noun, status scale, taglines. Future briefs extend this module;
  hardcoding new claims elsewhere will trip the guard.
- **Drift guard:** `src/lib/__tests__/claims-drift.test.ts` fails the build on any
  banned/retired term (lexicon + old figures + viewport rule). PROOF it works: on its
  first run it failed with 6 genuine hits (demo comment, war-room comment, 4 stale
  JSON stats) — fixed, now green. 82 tests total.
- Live acceptance (production bundles): demo chunks contain 0 retired stats and the
  Finder set; sandbox metadata serves. Lighthouse ≥95 runs remain a founder/local
  Chrome task (logged).

---

# v8.1 — Noun rename: pot → wish (founder-confirmed, incl. brand line)

- String-literal-aware sweep (prose strings with spaces and no /_- + JSX text incl.
  multi-line) — identifiers, event names, DB fields, URLs untouched (verified:
  pot.id/potId/pot_created/getPotBySlug intact; dashboards keep history).
- Routes: /pots/* → /wishes/*, /sandbox/pots → /sandbox/wishes with permanent
  redirects (Next emits 308, the modern permanent equivalent of 301) — old shared
  links work forever. Sitemap + internal links updated.
- claims.ts owns NOUN/"wish", NOUN_PLURAL, and the founder-approved brand line
  "Kindled — where wishes catch light." (hero badge + film end-card).
- Money-sense phrasing: "not just when the pot is full" → "not just when the goal is
  reached" (no forced noun). Read-aloud pass on top sentences: hero sub-head ("One
  shared wish, one link to send…"), share message ("We're all chipping in for Ava's
  Birthday — tap to join in"), payment sheet ("Demo — no money moves"), reveal beats
  ("something's been kept warm for you"), waitlist ("Reserve your spot") — all read
  naturally.
- Drift guard extended: user-facing pot phrases now banned; proven by catching 17 real
  leftovers (multi-line JSX + comments) which were then fixed — guard green.

## 2026-07-02 — Logo audit round 2, sandbox link, de-AI copy pass

- **Squashed logos, root cause**: `Logo` swapped to the compact 2-dot mark below 32px, and every header/footer renders at 30px, so nearly all lockups showed the cramped 2-dot blob. Threshold moved to 20px; lockup geometry now mirrors `public/logo/kindled-lockup.svg` (gap 10/64, wordmark 34/64, letter-spacing -0.015em). Verified by screenshot on homepage header/footer.
- **Last old logos found and removed**: hand-drawn K-flame app-icon SVG in the demo header (replaced with teal tile + kit mark) and two `FlameMark` flame SVGs in FirstKindlersCTA (replaced with `LogoMark`).
- **Sandbox link in demo**: persistent strip under the context bar, all views: "Like what you see? Build one of these yourself. → Open the sandbox".
- **De-AI editorial pass**: ~170 rendered em-dash constructions rewritten as full sentences across homepage, demo, sandbox, /p/[slug], reveal, films, legal and investor content; "not just X, it's Y" and "seamlessly" removed. Kept deliberately: brand line, quote-attribution dashes, retail product names, page-title separators, date ranges. Verified 0 rendered em dashes on homepage/demo via DOM walk.
- **Deploy note**: commits d615ca6 + 944a8f0 are on main but blocked by the Vercel free-tier 100-deploys/day cap; deploy + alias x4 once the window resets.

## 2026-07-02 — v9 Sandbox Elevation (feat/sandbox-elevation-v9)

**WS-1 crit**: full loop walked at 375×812 as organiser/contributor/receiver;
graded findings in audit/v9/CRIT.md (8 P0s, 8 P1s, 1 P2 deferred). All P0/P1 fixed.

**WS-2 Finished Wish layer, live at all five points:**
1. MaterialisingGift (src/components/sandbox/MaterialisingGift.tsx): sketched gift
   fills with ember glow by funded %; ribbon at 25, bow at 50, rising embers at 75,
   kit spark at 100. Ambient mode (receiver) carries no fill level — driven only by
   giftVisualFor() over the server-redacted view; unit-tested (gift-visual.test.ts,
   4 tests: ambient carries structurally no amount/percentage data).
2. Impact framing: amount step shows "£20 moves Ava's gift 14% closer"; the done
   beat shows "You just lit up N% of Ava's gift" with the gift visibly warmer.
3. Big-day teaser on the receiver view: sealed card, gift silhouette breathing over
   a soft halo, "Revealed on {date}". No numbers anywhere (server-enforced).
4. ExampleWishes gallery, badged "Example wishes · seeded demo data" (DMCC-safe),
   incl. one stacked-then-granted example; on the create page + My-wishes empty state.
5. Granted state: revealed/stacked wishes now open with a night-ground celebration
   panel (complete gift + spark, contributor count, reveal CTA).

**WS-3 animation inventory (all CSS, all neutralised by the global
prefers-reduced-motion block):**
- mg-breathe (3.2s) — "this wish is alive": progress-bar fill + gift ember fill + ambient halo.
- mg-ember-pop (0.6s, 6 staggered dots) — "your contribution just landed": done beat only.
- mg-spark-drift (4s) — anticipation: the kit spark over completed gifts.
- navigator.vibrate(10) on contribution success where supported.
- Milestone one-liners at ≥50% and ≥90% (copy, not modals).

**WS-4 copy/trust:** provenance line on every wish page ("Created by Sarah · for
Ava's birthday"); every ask now carries a persistent reason (not placeholder-only);
payment-sheet trust copy consolidated to one calm line + link; step markers
(Step 1/2/3 of 3) across the contribute flow; empty-list nudge on create;
receiver copy emoji trimmed.

Gates: build 0 errors, 86/86 tests (4 new), drift guard green. Deployed + aliased ×4.

## 2026-07-02 — v9 acceptance close-out (Lighthouse + evidence)

- Screenshot evidence now in the repo: audit/v9/01-create.png … 05-granted.png,
  captured from PRODUCTION at 375px via headless Chrome (create, guest wish at
  54% with bow + milestone line, receiver teaser, My wishes, granted state).
- Lighthouse (mobile, live site) before fixes: /sandbox perf 94 / a11y 96;
  homepage perf 81 / a11y 90.
- Fixed from those runs: amber-600→amber-700 section labels and stone-400→
  stone-500 helper text on all sandbox surfaces (4.5:1 AA); homepage mobile menu
  button aria-label + aria-expanded; marquee visible row unified with its clone
  at the AA-passing tone (was also a clone/visible mismatch).
- Granted-state polish: "sealed for the big day" now reads "unsealed at the
  reveal" once a wish is revealed.

**Final live Lighthouse (mobile), post-fixes:** /sandbox a11y **100** (perf 94);
homepage a11y **96** (perf 90, up from 81). Acceptance target a11y ≥ 95 met on both.

## 2026-07-02 — v9.1 durable sandbox LIVE (founder-approved provisioning)

- Neon Postgres provisioned via Vercel Marketplace (store `neon-cerulean-car`,
  founder accepted terms interactively), connected to kindledkindled, all env
  vars injected. Three Prisma migrations applied (init, kindle_memories,
  sandbox_state).
- Serverless lesson: the debounced post-response write never ran — Vercel
  freezes the function once the response is sent. Rewrote as dirty-flag +
  `flushPersist()` awaited before every mutating route response; failed flushes
  re-mark dirty for the next request.
- END-TO-END PROOF on production: wish `qk8pk7qctb` created → JSONB row
  confirmed in Postgres (4 pots) → fresh deployment forced (new instances,
  cold start) → wish loaded back through `ensureHydrated()` — PASS. The sandbox
  is now durable and cross-device.

## 2026-07-02 — post-DB loose ends closed

- /pots → /wishes had been 308-ing into a 404 since the v8.1 route move; /wishes
  now permanently redirects to /wishes/demo. Verified live: /pots resolves 200.
- Per-wish OG previews now hydrate from Postgres (generateMetadata + OG image call
  ensureHydrated). Verified on a cold deployment: og:title = "Chip in for
  Durability proof 2 🎉" — the original "per-pot OG titles on prod" unlock, done.

## 2026-07-02 — deferred backlog cleared (P3.2, P2.3, P3.1)

- **P3.2 receiver-view redaction, prop-level**: the demo recipient view now
  accepts only `ReceiverPot` (src/lib/demo/receiver-view.ts) — a shape that
  structurally cannot carry raised/contributors/tributes/draw entries. Goal
  figures stay (the recipient wrote their own list); progress cannot reach
  their DOM. Unit-tested (3 tests).
- **P2.3 friends scenario**: "Dan's 30th · the group of mates" example card in
  the recipient view's adult section — receiver-safe, badged Example.
- **P3.1 kids' circle-it, end-to-end in the sandbox**: child taps catalogue
  cards on the parent's device (manager-key link; zero child inputs — catalogue
  data only, per the Children's Code assessment); a felt-tip biro loop draws
  around picks (reduced-motion safe); items land unapproved; the organiser
  panel gains an approval queue ("Add it" / "Not this time"); approval makes
  the item live and grows the goal. Star-chart pots show the stars hookup line.
  Store functions circleItem/reviewItem unit-tested (3 tests); browser-verified
  full loop: circle → queue → approve → guest sees item, goal 0→45, and
  pendingItems never appears on guest/receiver payloads.
- Suite: 92 tests green (was 86).

## 2026-07-02 — v9.2: the waitlist was leaking (P0) — fixed and proven

Live-path audit found the site's PRIMARY CTA losing every signup: /api/signup
only forwarded to Resend, which was never configured in production, so
"Reserve your spot" emails vanished into a server log. Fix: signups now upsert
into Postgres (waitlist_signups) BEFORE any email attempt (lowercased, deduped,
silent-success on repeats); the sandbox "Register for launch" field lands in
the same table (source: sandbox); founder readout at
GET /api/admin/waitlist?secret=<SANDBOX_ADMIN_SECRET> (rate-limited).
CREATOR_SIGNUP_EMAIL set in production. Proven live end-to-end: POST signup →
row in Postgres → readout returns it (test row then removed).
Remaining founder step: create a Resend account + set RESEND_API_KEY to turn
notification emails on — signups are safe in the DB either way.
Also: last footer contrast stragglers darkened (homepage a11y toward 100).

**Final:** homepage a11y **100** (verified live post-deploy) — both audited pages now perfect: sandbox 100, homepage 100.

## 2026-07-02 — v8.2/v8.2b: colour system built, Direction 2 implemented behind the switch

**Mechanism (v8.2):** two token registers in globals.css — `legacy` captures
today's values VERBATIM (converted surfaces render pixel-identically);
`ember-teal` carries Direction 2 (warm paper #FAF5EB, teal structure
#085041/#04342C, ember #EF9F27 with dark-amber ink #412402, night reserved for
set-pieces). `data-theme` on <html>, default from src/lib/theme.ts
(DEFAULT_THEME = "legacy" — THE one-line founder flip / revert). Preview on any
URL with `?theme=ember-teal` (session-persistent, pre-paint, no flash).

**Direction-2 patterns live:** teal nav band + teal hero frame; TrustStrip
component (claims.ts TRUST copy — never hardcoded) under the hero and inside
the payment sheet; primary CTAs = flat ember with dark-amber ink (legacy keeps
the verbatim gradient via the --cta-bg token); footer flips to the night-step
teal with cream/mint text; wish cards stay white on cream; reveal backdrop and
granted/receiver panels bound to --night.

**AA contrast matrix (ember-teal, enforced as a unit test that fails on token edits):**
| pair | values | ratio |
|---|---|---|
| CTA dark-amber on ember | #412402 on #EF9F27 | 6.54:1 |
| mint on structure teal | #9FE1CB on #085041 | 6.31:1 |
| cream on structure teal | #E1F5EE on #085041 | 8.28:1 |
| ink on cream | #2C2C2A on #FAF5EB | 12.88:1 |
| soft ink on cream | #5F5E5A on #FAF5EB | 5.97:1 |
| structure-mid link on cream | #0F6E56 on #FAF5EB | 5.71:1 |
| cream on night step | #E1F5EE on #04342C | 12.07:1 |
| mint on night step | #9FE1CB on #04342C | 9.20:1 |

**--night usage (grepped, allowlist-enforced by test):** RevealExperience
(reveal backdrop), p/[slug]/page.tsx (receiver teaser ground + granted panel),
globals.css/theme.ts (definitions). OG/share cards use NIGHT_CANVAS from
theme.ts — server artwork can't read data-theme, so they follow DEFAULT_THEME
and regenerate on flip.

**Evidence:** audit/colour/ — hero/money/wish/sandbox-create ×
(legacy, ember-teal) + the current-default OG card. Logo variants: existing
dark-variant (cream) lockup reads correctly on teal structure; light variant on
cream — no missing variant, no TODO needed.

**Coverage note (honest):** converted this pass = homepage structure (nav,
hero, CTAs, footer, trust strip), the full sandbox loop, reveal/OG night
set-pieces. The marketing demo's interior (wishes/demo) still carries legacy
hex values — it renders identically in both registers until its own conversion
pass; the CI raw-hex rule is enforced on the token-component list and grows
with each converted file. Suite: 96 tests green (4 new colour guards).
DEFAULT NOT FLIPPED — founder previews with ?theme=ember-teal and flips
DEFAULT_THEME after the phone pass.

## 2026-07-02 — v8.2b coverage extension

Site chrome now responds to the switch: DemoBanner (--banner-bg), legal pages
(--page-plain: white under legacy, cream under ember-teal — honouring the
"no pure-white grounds" rule in Direction 2), film page ground. Remaining
unconverted (renders identically in both registers, logged for a future pass):
the marketing demo's interior mock (wishes/demo in-app surfaces + About-tab
Monochrome Luxe sections) and the investor war room. 96 tests green.

## 2026-07-02 — v11 THE SIXTEEN: completion audit

All sixteen workstreams executed. Evidence per audit line:
1. **Occasions**: 3-wish occasion created; contributions attributed to two
   different wishes from fresh sessions; Star atlas granted MID-OCCASION
   (£18/£18) while Telescope/beads stayed open; "wherever it's needed"
   auto-assigned to the closest-to-complete wish (verified live: £10 → the 33%
   Telescope, not the 0% beads); multi-wish receiver payload structurally
   amount-free (unit test + live grep). PASS
2. **Add-gift relocation**: contributor view has zero add-gift affordances;
   "Start my own wishes" K-CTA in header + vacated grid spot with ?ref chain +
   own_wishes_cta_tapped; recipient view gained "Add a wish". PASS
3. **Link-paste**: SSRF suite green (9 tests: private/loopback/link-local/
   mapped IPv6/file:/localhost/redirect re-validation, credential strip); live
   metadata-endpoint probe refused; real page extracted title/price/category;
   razor→moisturiser complement + 10 pairs; every paste normalised. Read cap
   truncates at 2MB (bounded memory) instead of failing large retail pages. PASS
4. **Star chart**: felt-tip ring on earned stars, 25/50/75 milestone lines
   (never modals), mini-Ignition at goal; grep zero streak/pressure/countdown
   patterns; global reduced-motion covers all new motion. PASS
5. **Billy owns his list**: "Managed by Mum (Sarah)"→"Built by Billy himself";
   context strip rewritten; grep for parent-manages-Billy claims: none. PASS
6. **Combining simulator**: MilestoneSimulator deleted surgically (panel
   metrics intact); no dangling refs/anchors. PASS
7. **Tabs**: solid token surface, active teal pill + cream text (a real
   stacking bug found and fixed with `isolate` — the pill was rendering behind
   the bar), inactive ink-soft, focus-visible outline; screenshots in session
   at 390×844. PASS
8. **Granted-first**: "Recently granted" strip top of contributor view
   ("Grandma Linda granted…" chips with expandable notes); owner stats hidden
   for contributors; first wish + Kindle CTA at y=652 of 844 unscrolled. PASS
9. **One reveal, no AI**: classic reveal block + RevealV2 machinery deleted;
   overlay copy de-AI'd; investor copy renamed (Reveal Quality, code-rendered
   content); grep user-facing "AI": zero. PASS
10. **Theme flip**: DEFAULT_THEME="ember-teal" (revert = same line, documented
    in theme.ts); browns-as-backing gone (legacy hero radial now only under
    the legacy register); AA matrix enforced as a unit test; manifest ground
    aligned. PASS
11. **Bubble**: "Where wishes catch light" hero pill removed, spacing healed. PASS
12. **Logo**: inventory grepped (zero old-asset refs); footer lockup now
    follows the register (light on legacy cream / dark on ember night-step) via
    theme-conditional classes; lockup rules exported as LOGO_RULES tokens;
    favicons already regenerated + cache-busted (?v=3). Re-scrape of WhatsApp
    previews: founder note (share a link to any chat to force it). PASS
13. **/beta**: server-gated (BETA_PIN env; wrong PIN → 401; "1066" absent from
    every client chunk — grepped), rate-limited, noindex; two tabs; CSV
    exports; waitlist writes confirmed end-to-end (v9.2 + live proof); sandbox
    reset run LIVE with survey rows intact + structural/behavioural test. PASS
14. **Survey**: 17 questions, one per screen, progress dots, branching
    (whip-round follow-up, parents-only WYR) unit-tested, WYR sides randomised
    per session, objection question present, consent + privacy at start;
    responses durable (survived a REAL sandbox reset); dashboard: headline
    stats, sparkline, pain ranking, WYR head-to-heads, appeal vs objections,
    parent/non-parent segment filter, open-text search, CSV; self-selected
    footer with n. Thank-you converts (source=survey) + native share. PASS
15. **K-loop**: formula, cycle-time axis, illustrative example labelled with
    maths shown (8 × 0.15 = 1.2), founder targets with wedge reasoning, three
    levers, live-dashboard tie-in; dashboard gained occasions panel (avg
    wishes/occasion + per-wish velocity). No invented traction. PASS
16. **Films**: /film archived (308 → home), footer link gone, investor film
    replaced with the animated economics diagram (money on every outcome);
    film system archived under /archive/film-system (renamed .txt, excluded
    from build) with README; deletion = founder decision. Grep "watch the
    film": zero. PASS

Suite: 111 tests green. Build clean. Live verification after deploy below.

**Live post-deploy verification:** data-theme=ember-teal live on all domains;
/film 308→home; /beta 200 with wrong-PIN 401 + PIN absent from bundle; /survey
live. Lighthouse mobile a11y: homepage 100, /survey 100, /sandbox 100 (helper
text darkened for the new cream ground). Deployment 54b5448 aliased ×4.

## 2026-07-02 — v11 second-pass verification (highest-standard sweep)

Re-walked every workstream in a rendered browser hunting for gaps:
- **3 gaps found and closed**: occasion_share was server-wired but no client
  fired it (now fired from WhatsApp/native-share/copy on the created screen);
  granted chips lowercased proper nouns (fixed); the sandbox own-wishes link
  now logs own_wishes_cta_tapped via beacon.
- **Rendered proof added for everything previously code-only**: creation nudge
  with Small/Medium/Dream one-taps; paste-a-link populating a real product;
  star chart felt-tip ring + "Three quarters!" milestone caught live at 23/30
  + full-chart Ignition celebration; reveal per-wish rows exercised end-to-end
  with MIXED outcomes (Fountain pen → gift_card, Notebook set → stack,
  verified in the store post-ceremony); investor Mechanism tab shows the
  K-loop panel complete (formula, cycle time, 8 × 0.15 = 1.2 example, founder
  targets, three levers, evidence-engine line) and Why-Now shows the
  economics diagram.
- One environment note: the investor dev-fallback PIN is 1066; production
  uses INVESTOR_PIN (4448) — gate API confirmed 200/401 both environments.

## 2026-07-02 — v11 third-pass refinements

- **Demo joins Direction 2**: the Vibrant Heritage paper tokens now remap under
  ember-teal (`:root[data-theme="ember-teal"]`, cascade-tested after the token
  parity guard caught the first attempt twice — the guard works); the demo's
  interior renders on the warm-cream register with coral/gold accents intact.
  Verified: --vh-sand resolves to #FAF5EB live.
- **Cycle time is now measured, not just claimed**: createPot stamps referred
  occasions with source_created_at at creation (no slug↔id joins), and the
  dashboard occasions panel shows the median hours from source occasion to
  referred occasion — making the investor K-loop panel's instrumentation line
  literally true.
- **Survey OG card**: dedicated night-set card at /survey/opengraph-image
  (kit dots, "Two minutes on gift-giving?", mint sub-line) — rendered and
  eyeballed at thumbnail proportions.
- Demo header subtitle truncates instead of wrapping at 390px; header ground
  tokenised (colour-mix over --vh-sand).

## 2026-07-02 — v11 PRODUCTION acceptance run (fourth pass)

Full loop executed against the LIVE site, every step API-real:
- Paste-a-link extracted a real product on prod (£52, Books); the AWS metadata
  SSRF probe refused on prod.
- 3-wish occasion created → kid circled a wish → parent approved → attributed
  contribution granted the atlas MID-OCCASION → "wherever it's needed" routed
  to the closest-to-complete wish → receiver payload amount-free → OG title
  "3 wishes for Ava — chip in 🎉".
- Reveal with mixed per-wish outcomes persisted (atlas taken, telescope
  stacked). **Finding fixed**: unfunded wishes previously inherited the
  occasion outcome (a £0 wish "taken as gift card"); they now stack by default
  — funded-only inherit. Unit test added (112 green).
- Survey completed on prod → row durable → thank-you waitlist capture
  (source=survey) → /beta showed BOTH; test email then removed from the live
  waitlist (survey demo rows retained, flagged in TODO).
- Spot checks: ?theme=legacy escape hatch shipped; 404/contact healthy;
  /beta noindex meta; robots.txt sane; full v11 event trail flowing
  (wish_added_to_occasion, kid_item_circled/approved, contribution_completed,
  reveal_outcome).

## 2026-07-02 — v11 final ledger (closing "every ask")

Two last gaps closed on final accounting:
- Per-wish reveal options now carry all three paths — Take / Stack / Switch
  (the brief's take/stack/switch; Switch = the product path per wish).
- Named survey funnel events now flow to the event stream (survey_started,
  survey_completed, survey_shared via the thank-you share beacon) alongside
  the durable rows.

Documented deviations (expert calls, logged not hidden):
- Wish reorder uses tap up/down arrows rather than drag — deliberate: reliable
  on mobile and screen-reader friendly; drag can layer on later.
- Granted chips expand an inline celebratory note rather than navigating to a
  separate granted page — the demo is a single-page simulation.
- Tab-contrast evidence is on the tabs' own solid token surface — making the
  bar solid was the fix; there is no longer a varying background to cross.
- /beta "name (if captured)": the waitlist deliberately captures email only
  (data minimisation); the column renders when a name source exists.
- Physical-device runs (real iPhone/Android) and the WhatsApp preview
  re-scrape remain founder-only, listed in TODO-FOUNDER.

## 2026-07-03 — v11.1 punch-list (external audit): all 17 closed

**P0-1 THE GATE (shipped first, as demanded):** src/lib/route-shell-audit.ts +
route-shells.test.ts — audits the BUILT html of every prerendered route
(15 shells incl. /sandbox, /beta, /survey, client-shell routes). Rules:
banned lexicon on visible text (script payloads stripped — no internal-name
false positives), Kindle-as-verb, Kindlers, retired stats, locked viewport,
per-route theme-color = #0C4E4C, large-card⇒og:image, retired-noun meta,
zeroed stat counters. NINE injection fixtures prove each rule detects its
miss class; the built-output sweep then ran against the pre-fix build and
caught exactly the audit's findings (kindle-as-verb, large-card-no-image,
zeroed-counter) before passing post-fix. The gate fails loudly when the build
is absent — it can never silently skip.

**P0 misses:** (2) /sandbox shell verified clean in current build (teal
theme-color, og:image, wish copy — the audit snapshot predated v8 fixes); all
15 shells enumerated and swept by the gate. (3) "Kindle" buttons → VERB_CHIP_IN
from claims.ts ("Chip in"/"Chipped in!"); "Kindle Paperwhite" (real product)
excepted. (4) /wishes/demo has its own night-set OG card (Billy framing,
rendered 200, in build). (5) useCountUp SSRs the TRUE figure (58% in built
html — gate-tested); count-up is enhancement only.

**P1 demo corrections:** (6) granted strip top + open wish/Chip-in unscrolled
at 390×844 — contributor-state screenshot: audit/v11-1/contributor-390x844.png.
(7) "Reserve your spot", sentence-case perk chips, consent line aligned.
(8) "Parent's pick" chip removed; zero parent-management claims on Billy
(grep). (9) all rendered dates derive from occasionTargetIso (rolled forward;
past dates cannot render). (10) ONE lockup: Logo variant="auto" +
.logo-follow-theme CSS vars — "KindledKindled" gone from built footer
(grep-verified); demo h1 is "Kindled" with the subtitle a sibling <p>.
(11) DrawMicrocopy component (claims.DRAW + terms link) at every draw mention
(demo sheet, conversion block, ceremony).

**P1 evidence (12–17):** sandbox internals covered by 124-test suite (occasions
+ redaction, K-CTA, SSRF ×9, star beats) and the v11 production acceptance run;
/beta PIN "1066" absent from every built chunk (grep 0) + reset-survival test
green; survey branching/WYR randomisation unit-tested, prod completion → /beta
proven 2026-07-02; zero user-facing "AI" across ALL built routes (visible-text
grep: none); tab states screenshot (teal pill/cream bar, AA); sandbox
ember-teal screenshot audit/v11-1/; homepage dupes: "KindledKindled" fixed,
marquee clones aria-hidden (99 aria-hidden nodes in shell).

Suite: 124 green (12 new gate tests). v11 sixteen-point audit re-affirmed —
items unchanged by v11.1 stand on the 2026-07-02 evidence; items touched
(2,3,7,8) re-verified above.

**v11.1 close-out:** demo a11y raised 90 → 95+ live (close/remove buttons named, strip contrast, heading order). Live SHA verified per deploy throughout.

**Final:** demo a11y **100** live (every audited route now perfect: homepage
100, sandbox 100, survey 100, demo 100). Kids' warmer-mix register (v8.2b
pattern 5) completed as .kids-register — token-derived, a mode not a palette.
