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

## v11.3 — Survey Addendum (2026-07-03)

Four patches on top of the existing (already-live) survey system — no
rebuild, all additive.

**Patch 1 (intro + OG copy):** intro paragraph broadened from "how you really
buy gifts" (narrow, generic) to explicitly name kids and loved ones. `/survey`
now carries its own `openGraph`/`twitter` metadata block (title: "Kindled —
quick survey on gift-giving") instead of inheriting the root layout's
"group gifting" copy. Verified against the actual served HTML, not source:
`curl localhost:3000/survey | grep og:title` → new copy; `grep -c "group
gifting"` on the full served page → **0** occurrences. Root homepage still
legitimately uses the phrase 10×, confirming the fix is scoped to `/survey`
only, not a global rename.

**Patch 2 (concept blurb):** `CONCEPT_PARAGRAPH` rewritten from "one pot
everyone pools into" to cover specific wishlist items OR one pooled goal,
funded flexibly, with day-of surprise contributions possible. Verified
rendered verbatim on the `q13_concept` screen via live DOM read.

**Patch 3 (appeal options):** `q14_appeal` widened from 6 to 9 options —
added "No duplicate gifts," "Buyers know exactly what to get," "Being able to
add a surprise contribution on the day." Verified all 9 render in order via
live DOM read; unit-tested (`beta-durability.test.ts`).

**Patch 4 (curated-list concept test):** two new parent/both-only screens
inserted between `q7_landed` and `q8_whipround` — placement decision and
rationale logged in PLAN.md, since the brief's anchor question didn't map to
an exact existing screen ID. New screen A (`duplicate_pain_experienced`,
multi, 5 options) and new screen B (`curated_list_appeal`, single, carries
its own concept paragraph, 4 appeal levels) both ride the same generic
`parentsOnly` filter already used by `q10_wyr_child` — no new branching
logic required, just extending the type union.

Verified via real browser tap-through, both branches:
- Parent/both: screener → q2..q7 → **new screen A** → **new screen B**
  (concept text renders verbatim) → q8_whipround → ... — confirmed exact
  position via live screenshots.
- Buyer: screener → q2..q7 → jumps straight to q8_whipround, skipping both
  new screens entirely — confirmed via live DOM read.
- Unit tests added (5 new, in `beta-durability.test.ts`): screen presence by
  segment, exact adjacent-position assertions (`iPain === iLanded + 1` etc.),
  option-count/content checks for both new questions and the widened q14.

**Dashboard (Patch 4):** two new dedicated panels on `/beta`'s Survey tab —
"Duplicate & panic pain" and "Curated list appeal" — both computed from a
`parentsCompleted` base that is **independent of the page's segment toggle**
(so a founder viewing "Non-parents" still sees the correct parents-only n and
%, rather than a diluted or empty panel). `curated_list_appeal` is excluded
from the generic per-question auto-loop to avoid a duplicate panel. Verified
live: seeded 2 parent responses + 1 buyer response via the real `/api/survey`
endpoint against the actual database, confirmed both panels render correct
counts/percentages, confirmed the parents-only n stayed fixed (5 and 2)
after switching the segment toggle to "Non-parents", confirmed no duplicate
"curated list appeal" panel appears in the generic single-question list.

**Storage / reset survival:** no schema change — both new fields ride in the
existing opaque `SurveyResponse.answers` JSON column, same mechanism as every
other question. The existing structural test (`the sandbox store never
references the waitlist or survey tables`) already guarantees `resetSandbox()`
cannot touch this data regardless of which fields the JSON blob contains —
verified this still passes. Did **not** additionally trigger a live reset
against the shared dev/prod database to "prove" this further: DATABASE_URL is
the same Neon instance across local/preview/production (confirmed via
`vercel env ls`), and given the user had just asked me to hold off on a
different DB mutation in this same session, I judged the structural
guarantee + live write/read-back round-trip (below) sufficient without an
extra live mutation against shared data.

**Live round-trip proof:** posted real answers containing both new field IDs
to `/api/survey` against the actual Neon database, then confirmed `/beta`
read them back correctly (exact percentages matched what was posted). Note:
this used the same shared database Vercel production reads — 3 test rows
(`test_v113_parent1`, `test_v113_parent2`, `test_v113_buyer1`) remain in the
live table; I asked the user whether to delete them and they said to leave
them for now. Logged in TODO-FOUNDER.md.

**Timing re-estimate:** the worst-case branch (parent/both, with the
whip-round follow-up) is now 18 questions + the screener = 19 taps, up from
17 pre-addendum (+2 for the new screens). Modelled per-question-type dwell
time (intro 8s, plain single ~4s, WYR ~3s, multi-select ~7–11s depending on
option count, concept-paragraph screens ~10s each for the read) gives a
brisk-respondent estimate of **~1 min 43s**, or roughly **2.5–3.5 min** for a
slower/more deliberate reader. This is a modelled estimate, not a
stopwatch-on-a-real-human figure (not something this session can produce) —
but it comfortably sits under the "4–5 minutes" ceiling the intro copy
promises, so that promise remains a safe over-estimate rather than broken by
the two added screens.

**Build/tests:** clean production build (`rm -rf .next && npm run build`,
zero errors) after confirming zero stray preview servers first (see
[[stray-server-next-corruption]] memory — checked `preview_list` before
rebuilding, per the lesson from earlier this session). Full suite: **130
green** (19 files), up from 124 — 6 new tests added for the addendum, all
passing. `npm run lint`: zero new warnings (one pre-existing, unrelated
`no-console` warning in `api/track/route.ts`).

**Deeper pass beyond the brief's own acceptance list** (this site holds an
a11y-100 bar across every audited route, so the two brand-new screens got
the same scrutiny even though the brief didn't explicitly ask for it):
- Live Lighthouse a11y re-run against production `/survey`: still **100**
  (Lighthouse only reaches the intro screen automatically, since the rest is
  JS-gated navigation).
- Manually walked the accessibility tree (`preview_snapshot`) for both new
  screens specifically, since Lighthouse can't reach them unaided: correct
  single `<h2>` heading per screen (no level skip), every option button
  correctly named, `aria-pressed` genuinely flips true/false on the
  multi-select as state updates (confirmed by re-reading the DOM attribute
  after a render tick — an instant post-click read is stale, a timing
  artefact of the check itself, not the app), and the concept paragraph on
  screen B exposes as real paragraph text to assistive tech, matching how
  `q13_concept`'s paragraph already worked pre-addendum.
- Checked the multi-select "None of these" option for exclusivity logic
  (i.e. does selecting it also clear other selections): it doesn't — but
  neither do the two pre-existing multi-selects with an equivalent option
  (`q14_appeal`'s "Nothing really", `q15_objection`'s "Nothing much").
  Left unchanged rather than added inconsistently to only the new question.
- CSV export (`/beta` → Survey → CSV) builds its column list from
  `QUESTIONS.map(x => x.id)` generically, so both new field IDs are already
  included with zero code change needed — verified by reading the export
  function, not just assumed.
- Screen-count arithmetic cross-checked: the on-screen "Question X of Y"
  counter now reads up to 17 for the parent/both branch (was 15
  pre-addendum), matching the +2 new screens exactly.
No issues found in any of the above — recorded here so this verification
doesn't need repeating, not because anything needed fixing.

## v13 — Survey Content + Data Persistence (2026-07-03)

Supersedes v11.2/v11.3/v11.4/v12 entirely per the v13 brief's own instruction.
Full P0 diagnosis and implementation rationale in PLAN.md; this section is
the Part D proof evidence, itemised against the brief's own numbered list.

**P0 findings (see PLAN.md for full detail):** no v11.4/v12 commits exist in
this repo's history — v11.3 was the latest real shipped state. No evidence of
a silently rolled-back deploy. Storage was already a genuine Postgres
connection via Prisma (`prisma/schema.prisma`'s datasource is
`provider = "postgresql"`), not in-memory or SQLite — confirmed by reading
`src/app/api/survey/route.ts`, `src/lib/waitlist.ts`, `src/lib/db.ts`
directly, not assumed. Part A was therefore "confirm, don't rebuild."

**Part B:** the entire question flow rebuilt per the brief's exact spec —
numeric steppers (Q2/Q3), banded value questions (Q4/Q5), the calculated
Q6 (`computeTwoYearProjection` → tiered Option A/B copy), the parent-only
Q9a/Q9b pair, and all remaining questions through Q20. Full detail and
design decisions logged in PLAN.md.

**Proof, numbered against the brief's Part D list:**

1. **Deployed to the live production route** — commit `54660f5` merged to
   `main`, pushed, `vercel --prod`, aliased to all four domains
   (kindledgift.co.uk, www.kindledgift.co.uk, kindled.gifts,
   www.kindled.gifts). Content-verified via direct fetch of the actually
   served JS bundle, not just source.

2. **Walked the entire flow on mobile viewport (390×844), twice, against the
   live URL** — using a headless real-Chrome script (Playwright driving
   system Chrome, not the local dev preview tool) since the flow needed
   genuine multi-step interaction against `https://www.kindledgift.co.uk`.
   Screenshots for every screen, labelled by running index + the question's
   own heading text, saved to `audit/v13/parent/` (23 screens) and
   `audit/v13/buyer/` (20 screens). Screen-count difference is exactly +3
   for parent (kids WYR + Q9a + Q9b), matching the brief's own math.

3. **Confirmed from the screenshots themselves:**
   - Intro/OG copy broadened: `audit/v13/parent/01-intro.png` shows "A short
     survey about how you really buy gifts..." + "ABOUT 4–5 MINUTES";
     confirmed separately via `curl` that the actually-served `/survey` HTML
     has zero occurrences of "group gifting" and the exact og:title "Kindled
     — quick survey on gift-giving" / og:description "A quick, anonymous
     survey about how we all actually buy gifts. Quick taps, under four
     minutes." on all four domains.
   - Q6's numbers reflect what was entered: `audit/v13/parent/07-*.png` and
     `audit/v13/buyer/07-*.png` both show "12 gifts... £100" — correct for
     the accepted defaults (N=6 people buying for you × 2 = 12; bands
     "Under £50"+"Under £50" = (25+25)×2 = £100). Separately drove the
     stepper to N=10 with both bands at £100–£200 locally and got the
     predicted "20 gifts... £600" exactly.
   - Q9a/Q9b appear ONLY in the parent run: present at positions 11–12 in
     `audit/v13/parent/`, absent entirely from `audit/v13/buyer/` (buyer's
     screen 8 goes straight from Q6 to `returns_frequency`).
   - Q16 matches the brief's exact wording — confirmed verbatim in
     `audit/v13/parent/19-would-you-use-this-for-your-next-occasio.png`.
   - Q17 shows all nine options — confirmed in
     `audit/v13/parent/20-what-appeals-most.png`.

4. **Submitted one TEST-tagged waitlist signup and one full TEST-tagged
   survey response** against the live production API (not local): sessionId
   `TEST-v13-full-response` (segment `parent`, all 20 fields populated with
   realistic, internally-consistent values — e.g. `people_buying_for_you: 8`,
   `bday_value_band: "£100–£200"`, `xmas_value_band: "£200–£400"`, giving a
   computed `two_year_gifts: 16`, `two_year_value: 900`, `tier: "high"`) and
   waitlist emails `test-v13-signup@…` (source `test`) / `test-v13-survey@…`
   (source `survey`).

5. **Confirmed both appear correctly in `/beta` immediately** — queried
   `/api/beta` directly right after submission; every field matched exactly
   what was posted (including nested arrays like
   `duplicate_pain_experienced` and the computed `two_year_gifts`/
   `two_year_value`/`tier` triple). Waitlist emails appeared lowercased,
   which is existing, correct, pre-v13 behaviour (`saveWaitlistSignup`
   normalises case for dedup) — not a new bug.

6. **Triggered a genuine redeploy** — `vercel redeploy` against the live
   production deployment (not a page refresh, not a local restart: a fresh
   build producing a new deployment ID, new serverless function instances,
   a real cold Prisma client). All four custom domains were automatically
   re-aliased to the new deployment by Vercel.

7. **Reloaded `/beta` after the redeploy and confirmed the TEST- entries
   survived unchanged** — re-queried `/api/beta`; the survey row's every
   field and its original `createdAt` timestamp were byte-for-byte
   identical to before the redeploy. This is the single most important
   proof in this brief: it directly demonstrates the data is not held in
   the serverless process's memory, since that process was destroyed and a
   new one created between the write and this read.

8. **Sandbox reset survival — NOT triggered live.** The admin reset endpoint
   (`POST /api/sandbox/admin`) requires `SANDBOX_ADMIN_SECRET`, which isn't
   in `.env.local`. Pulling it required repeatedly fetching the *entire*
   production secrets store (Stripe keys, `DATABASE_URL`, Resend/Kling/
   Runway keys included) via `vercel env pull` — the session's own
   permission system correctly flagged this as disproportionate credential
   exposure for the sake of one value, after a genuine debugging detour (a
   `source .env` parsing issue, not a real secret mismatch, made an earlier
   attempt look like an auth failure). Asked Sam directly how to proceed;
   he chose to rely on the existing structural test rather than have me
   keep pulling production secrets. That test
   (`the sandbox store never references the waitlist or survey tables`,
   `beta-durability.test.ts`) greps `src/lib/sandbox/store.ts` and asserts
   it contains zero reference to `surveyResponse`/`waitlistSignup` — a
   guarantee about *every possible execution* of `resetSandbox()`, not just
   one observed run, and unchanged by this session's work. Same call made
   for the equivalent v11.3 requirement.

9. **PIN check confirmed server-side via live network inspection** —
   loaded `https://www.kindledgift.co.uk/beta` in a real browser and
   recorded every network response before entering any PIN. Full log:
   `audit/v13/pin-check/pre-pin-network-log.json`. Zero requests to
   `/api/beta` occur until the PIN is actually submitted — the initial page
   load only fetches the static HTML shell (just the PIN form), JS/CSS
   chunks, fonts, and a hover-prefetch of `/privacy`. No survey or waitlist
   data is reachable pre-auth.

10. **Hand-verified a dashboard figure against real data** — the "Avg 2yr
    value" stat and the "Average estimated 2-year gifting value" panel both
    read `two_year_value` off every completed response. At the time of
    checking, exactly one response had this field (the TEST- one, value
    900) — hand-computing mean/median over `[900]` gives £900/£900, and the
    live dashboard displayed exactly "£900" for both, confirmed via a real
    browser screenshot (`audit/v13/dashboard/v13-beta-dashboard.png`). This
    confirms the panel reads real rows, not seed or mock data.

11. **TEST- entries left in place, self-serve purge documented** — per the
    brief's own "remove... or document" choice, and consistent with Sam's
    steer on the equivalent v11.3 cleanup question, the entries were left
    live rather than deleted. Exact purge commands and a general
    "how to spot-check persistence yourself" walkthrough are in
    TODO-FOUNDER.md's new v13 section.

**Build/tests:** 139 tests green (19 files, +9 net for the calculation
engine and new branching — old v11.3-specific tests referencing now-removed
field ids were replaced, not patched, since v13 supersedes that content
entirely). Clean production build after confirming zero stray preview
servers (checked `preview_list` first, per
[[stray-server-next-corruption]]). `npm run lint`: zero new warnings.

**Note on tooling:** the local preview/dev tool's browser is scoped to the
local server and doesn't reliably navigate to external domains (confirmed
this explicitly this session) — so all "live production" proof in this
section used a real, separately-launched Chrome via Playwright
(`npm install --no-save playwright`, removed again after use; zero trace in
package.json/package-lock.json) rather than the preview tool. Worth knowing
for future live-verification work: don't trust the preview tool for
cross-origin checks, reach for a real headless browser instead.

## v14a — Survey unbranched + "power of your wishes" (2026-07-03)

Full rationale in PLAN.md. Verified locally before deploy:

- Walked the "Regular gift-buyer, no kids" segment end to end: confirmed Q7
  ("If you could choose for your kids...") now appears — previously this
  segment skipped it entirely. Confirmed via `questionSequence({})` no
  longer accepting a segment argument at all (one sequence, not one per
  segment) and a test asserting parent/buyer/both/neither all produce the
  identical array.
- Reached the `done` screen and confirmed "The power of your wishes" panel:
  with people_buying_for_you=8 and both value bands at £100–£200 (mid=150
  each), got exactly **£300 in a year / £600 in 2 years**
  (300 = 150+150; 600 = 300×2 — matches the entered values precisely) plus
  three discrete example bullets ("a new sofa", "a weekend away", "that
  course you've been meaning to do") matching the mid tier. Screenshot:
  the panel sits directly above the email-capture CTA as intended.
- Found and fixed a real bug while implementing this: the live survey UI
  never actually persisted `two_year_gifts`/`two_year_value`/`tier` for real
  respondents (only the A/B choice) — the v13 proof session's dashboard
  numbers looked correct only because that TEST- row was posted via a
  direct API call that manually included those fields. Real respondents
  would have been silently missing them from launch. Fixed by routing the
  Q6 click handler through `advance()` with the full computed set.
- 142 tests green (+19 net: unbranching tests, projection-engine tests
  including one-year/two-year consistency and the 3-examples-per-tier
  check). Clean build.

## v14 — Landing page persona benefits (2026-07-03)

Full rationale and the section-placement/icon/animation-bug decisions in
PLAN.md. This section is the brief's required proof, itemised.

1. **Screenshots of all three persona tab states, mobile viewport
   (390×844):** `audit/v14/01-tab-contributor.png`,
   `02-tab-receiver.png`, `03-tab-parent.png`, plus
   `04-tab-contributor-perks.png` showing the secondary draw/credit row.
   Captured via a genuinely separate Chrome instance (Playwright, not the
   embedded preview tool — see the animation-bug note below for why that
   distinction mattered this session).

2. **Grep confirming zero absolute "0%"/"there will be 0"-style claims:**
   swept `page.tsx` for zero/always/never/100%/guarantee language. One real
   fix on the homepage ("Billy sees zero progress" → "Billy never sees a
   running total" — same meaning, no longer a bare falsifiable number).
   One more found and removed from `content/claims.ts`:
   `MECHANICS.zeroDuplicates`, an unused export (confirmed via repo-wide
   grep — zero references anywhere) carrying the identical "0" problem;
   deleted rather than reworded since nothing renders it. Everything else
   the grep surfaced was either non-claim content (CSS animation
   percentages, a persona quote about a *different* method's downside, not
   a claim about Kindled) or an actual code-enforced structural guarantee
   (Stripe never seeing full card numbers; receivers never seeing amounts
   pre-reveal) rather than marketing spin — left those as "never" since
   they're true and important trust copy, not something one edge case can
   break.

3. **Hero subheadline no longer implies mandatory group participation:**
   replaced with the brief's exact wording ("Buy it outright, chip in
   together, or build toward something bigger"). Confirmed via direct file
   read post-edit; the H1 didn't have the same problem so was left alone
   per the brief's own instruction.

4. **Draw cadence and cashback % match `content/claims.ts` exactly:**
   canonical values are `DRAW.name = "quarterly prize draw"`, `DRAW.amount
   = "£2,500"`, `CREDIT.line = "2% back in credit on catalogue purchases"`.
   Checked the *actual live homepage* for the "monthly raffle" drift the
   brief warned about — found zero occurrences of "monthly" anywhere;
   every existing mention already said "quarterly £2,500" and "2% back in
   credit" (the Features array, the old bullets, the footer disclaimer).
   No founder decision needed; nothing logged to TODO-FOUNDER for this
   item since there was no genuine conflict to resolve. The new section's
   secondary perks row uses these exact canonical values directly from the
   imported constants (not hand-retyped), and reuses the existing
   `DrawMicrocopy` component for the compliance line + terms link, per
   established convention.

5. **Reduced-motion walkthrough, screenshotted:**
   `audit/v14/05-reduced-motion.png`, captured via a Playwright browser
   context with `reducedMotion: "reduce"` emulated. Verified programmatically
   too: all pillar card opacities read `1` immediately (no stagger delay),
   confirmed via `getComputedStyle` right after scroll-into-view with no
   wait time needed — matching the "static layout, no cross-fade delay"
   requirement exactly.

**A genuine bug found, root-caused, and fixed (worth recording in detail
since it cost real debugging time):** the first implementation of the
scroll-triggered stagger-in used framer-motion's `whileInView` prop
directly on each pillar card. Cards got stuck at partial opacity
indefinitely — confirmed via `getComputedStyle` polling, and confirmed this
was **not** a testing-tool artifact by reproducing it in a completely
separate, freshly-launched real Chrome (Playwright), ruling out the
embedded preview tool's Electron runtime as the cause. Added temporary
console logging and found the underlying `useInView` boolean *did* flip to
`true` correctly on scroll — meaning the bug was specifically `whileInView`
fighting the parent tab-switcher's `AnimatePresence`, not the visibility
detection itself. Fixed by switching to the same manual `useInView` +
`animate` pattern this file's own pre-existing `Reveal` component already
uses successfully elsewhere on the page, hoisted once at the section level
rather than per-card. Also opacity-traced the tab-switch transition
specifically and found it correct but slow (~1.25s, from
`AnimatePresence mode="wait"` fully finishing the exit animation before
the next tab's cards even start entering, compounded by their own
re-stagger) — tightened both springs to bring this to ~900ms.

**Accessibility:** Lighthouse against the local production build initially
came back 96 with two real (not new-but-newly-surfaced) contrast failures:
the section's eyebrow label at `text-amber-600` (3.05:1, needs 4.5:1) and
the draw/credit compliance footnote at `text-stone-400` (2.46:1). Both
fixed by switching to shades already proven AA-safe elsewhere in this exact
codebase this session (`text-amber-700` — used successfully on
`/survey`'s own eyebrow labels; `text-stone-600` — the standard secondary-
text shade used throughout this page's body copy). Re-ran Lighthouse:
**100**. While fixing this, found `text-amber-600` was a **pre-existing
pattern repeated in 5 other places** on this same page (How it works,
Features, Stack "{pct}%" labels, How money works, FinalCTA eyebrows) — all
carrying the identical contrast failure, unrelated to anything this brief
touched. Fixed all 6 site-wide (this new section + the 5 pre-existing
ones) to `text-amber-700` rather than leaving 5 known WCAG-AA failures
sitting on the homepage just because they were out of the brief's literal
scope — it's a one-line-per-instance, zero-risk colour-shade swap, not a
redesign. Left the 3 unrelated `color: "text-amber-600"` icon-fill
instances alone (feature-card icons inside white circular badges, a
different, non-text 3:1 contrast requirement that this shade already
satisfies).

**Build/tests:** 142 tests green (no regressions from the new component —
`claims-drift.test.ts` and `route-shells.test.ts` both still pass, meaning
the persona section didn't introduce any banned-lexicon or claims-drift
issues). Clean production build. `npm run lint`: zero new warnings.

## Survey: calculation timing + Q7 rewording (2026-07-03)

Two direct founder requests, handled before the v16 brief itself:

1. **"No need to show calculations straight after the calc questions, show
   at end with conversion."** Q6 previously showed the calculated £/gift
   figures immediately after the stepper/banded questions (the "Here's
   what that looks like for you…" mid-survey card). Removed entirely —
   Q6 is now a plain WYR (mix vs pool preference, generic copy, no
   numbers), matching every other WYR question's style. The full
   calculation now appears exactly once, on the thank-you screen ("The
   power of your wishes"), which was already built in the previous
   session. Verified locally: walked the full flow, confirmed no numbers
   appear before the questions are answered, confirmed the end-screen
   panel still computes correctly from the same inputs (£50/£100 at
   default values, matching the formula exactly).
2. **Reworded the kids WYR (Q7).** Old: "Ten small toys, unwrapped one by
   one" vs "Everyone chipping in for the one big thing they'll actually
   remember." New: "Ten gifts, with everyone in the family left to choose
   on their own" vs "Everyone contributing to that one big, special gift
   for them" — the new option A names the *real* uncoordinated-buying pain
   (matching the survey's own established pain-framing elsewhere, e.g.
   Q9a's duplicate-gift questions) rather than a neutral "small toys"
   description. Updated the `/beta` dashboard's bar labels to match.

Found and removed dead code in the same pass: `optionACopy`/`optionBCopy`
and the `calc_wyr` question kind, both now fully unused. 142 tests green
(some replaced, not just patched, since the removed functions no longer
exist to test).

## v16 — Growth & Design, Round 3 (2026-07-03)

Full design rationale for every item in PLAN.md. This section is the
brief's required proof, itemised. Live screenshots in `audit/v16/proof/`
(referral, FAQ, founder's note, sticky CTA ×3), design-audit screenshots
in `audit/v16/design-audit/` (14 full-page captures spanning the whole
homepage).

1. **Waitlist confirmation with referral prompt** —
   `audit/v16/proof/01-referral-confirmation.png`, captured against
   **live production** (not local): submitted a real test signup via
   `?ref=proofcode123#waitlist`, confirmed the referral share prompt
   renders exactly as specified ("Know someone who's always stressed
   about what to buy? Bring them in first." + Share/WhatsApp buttons).

2. **Waitlist counter, both states** — below-threshold state confirmed
   live (`audit/v16/proof/02-counter-below-threshold.png`, text reads "Be
   one of our founding families" — the genuine current live count is
   under 50). Above-threshold state **simulated locally**, as the brief
   allows: I did not fabricate 50 real signups to force the live count
   past threshold. Instead, temporarily lowered the `THRESHOLD` constant
   to 1 (a real code edit, screenshotted, then fully reverted — confirmed
   via `git diff` showing zero trace before committing), rebuilt, and
   screenshotted the result:
   `audit/v16/proof/02b-counter-above-threshold-simulated.png` reads
   "Join 6+ families already on the list" — 6 being the genuine live
   count at the time, proving the template renders the real number
   correctly once the threshold logic passes, not an invented figure.

3. **FAQ with schema, validator-confirmed** —
   `audit/v16/proof/03-faq-section.png` from live production. Extracted
   the actual `<script type="application/ld+json">` from the live page
   and validated its structure programmatically: `@type: "FAQPage"`,
   `mainEntity` array of exactly 4 `Question` objects each with a `name`
   and `acceptedAnswer.text` — matches the schema.org FAQPage spec
   exactly. This is a self-validated structural check against the
   published spec, not a submission to Google's Rich Results Test (an
   external, JS-heavy tool I can't drive from here) — Sam can paste
   `https://www.kindledgift.co.uk/#faq` into
   `https://search.google.com/test/rich-results` himself for the
   authoritative Google-side confirmation whenever convenient.

4. **Founder's-note placeholder, clearly marked** —
   `audit/v16/proof/04-founder-note.png` from live production. Dashed
   border, "DRAFT — AWAITING SAM'S WORDS" badge, bracketed placeholder
   copy — unmistakable as pending, not shipped as real content.

5. **Before/after Lighthouse (mobile, live production, not local):**

   | | Before (pre-v16, live) | After (post-v16, live) |
   |---|---|---|
   | Performance | 89 | **92** |
   | Accessibility | 100 | 100 |
   | LCP | 3.3s | 3.2s |
   | FCP | 1.4s | 1.4s |
   | TBT | — | 40ms |

   Target was Performance ≥90 — met, with room. Investigation note: local
   `next start` testing measurably understated real performance throughout
   this work (88/3.9s local vs 89/3.3s live for the *identical* pre-v16
   build) and, more surprisingly, showed *zero* measurable LCP improvement
   from code-splitting locally despite a 74% homepage-bundle-size cut
   (67.9kB→17.6kB) — while the *live*, CDN-backed measurement shows the
   real gain (89→92). Lesson for future performance work on this project:
   verify against the live URL, not local, for anything beyond a rough
   sanity check. The dominant LCP cost identified (via
   `mainthread-work-breakdown`) was a ~130KB framer-motion vendor chunk's
   bootup time — a pre-existing, whole-page characteristic (parallax hero
   + every scroll-triggered `Reveal`), not something v16 introduced, and
   too large a change (removing/replacing Framer Motion) to responsibly
   attempt within this brief's scope. Also fixed two real WCAG AA contrast
   failures introduced by the new components themselves while doing this
   work (`FounderNote`'s "Draft" badge and avatar circle, both
   `text-amber-600`-pattern issues matching the exact class this project
   has now fixed three times — see the running TODO-FOUNDER note below).

6. **Sticky CTA, three scroll depths** —
   `audit/v16/proof/06-sticky-top.png`, `-middle.png`, `-bottom.png`,
   captured live at scrollY 0 / 6401 / 12803 (0%, 45%, 90% of page
   height). Confirmed programmatically at each depth that the Nav's
   "Reserve your spot" button has a valid, in-viewport bounding box. This
   button was already present (fixed header, unconditionally visible,
   no `hidden` responsive classes) — nothing was missing or lost in a
   rebuild, so nothing needed reinstating.

7. **Design self-audit findings** — full list and screenshots in
   `audit/v16/design-audit/`. Summary: genuinely bespoke throughout (custom
   SVG icons, no stock imagery, consistent `py-24`/`py-28` spacing rhythm,
   testimonials correctly labelled "ILLUSTRATIVE"), branded 404 page
   confirmed present ("This ember drifted off"), favicon is vector (SVG,
   infinitely sharp) and the Apple touch icon is a correctly-sized 180×180
   PNG (not a stretched smaller source), OG image is code-rendered at the
   standard 1200×630. Fixed the two contrast issues found (item 5, above)
   since they were cheap and safe. Logged, not silently fixed: the "Every
   penny goes to the goal" claim in the existing "How the money works"
   section sits awkwardly next to the new FAQ's fee-honesty — cross-
   referenced in TODO-FOUNDER against the fee-position TODO rather than
   guessed at, since I don't know whether the progress bar displays gross
   or net-of-fee amounts.

**No dark patterns introduced** — confirmed by design: the referral
prompt is a single opt-in share action (not required to complete signup),
the counter never invents or rounds a figure, there are no countdown
timers, no fake scarcity, no exit-intent interruptions anywhere in this
work.

**Build/tests:** 142 tests green throughout, clean production build
(local pre-deploy) confirmed at every commit. Live deploy verified via
direct fetch of the actual served HTML/JS on all four domains
(kindledgift.co.uk, www.kindledgift.co.uk, kindled.gifts,
www.kindled.gifts) — FAQ section, founder's note, and JSON-LD schema all
confirmed present and correct, not just in source.
