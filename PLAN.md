# Master Brief v3 — Plan & Audit

Branch: `feat/master-brief-v3` · Stack confirmed: Next.js 15 (App Router), TypeScript,
Tailwind v4, Framer Motion. Investor route: `/investor`, PIN validated server-side at
`/api/investor` (content never in the client bundle — verified previously by bundle grep).

## Phase 0 audit (recorded before any work)

| Item | Status | Evidence |
|---|---|---|
| /privacy, /terms, /contact routed; no `href="#"` in footer | **DONE** | routes exist; grep for `href="#"` → 0 |
| Consent banner, privacy-first | **DONE** | `ConsentBanner.tsx`, non-essential off by default |
| Prize draw: free entry + 18+/UK + linked terms | **DONE** | terms `#prize-draw`, footer microcopy |
| No invented testimonials as real reviews | **DONE** | "Illustrative" scenarios, personas not people |
| "How the money works" | **DONE** | homepage section `#money` + /terms `#how-money` |
| CTA architecture (waitlist primary, demo secondary) | **DONE** | "Reserve your spot" hero/nav/final + demo pill |
| Terminology: one noun, one status scale | **DONE** (see P2.1 gap) | pot everywhere; Just started → Fully funded |
| Counters correct without scroll; stats sourced/consistent | **DONE** | CountUpStat defaults to real value; sources shown |
| Viewport allows pinch-zoom | **DONE** | layout.tsx, no maximumScale/userScalable |
| Demo dates relative; personas age-appropriate | **DONE** | occasionTargetIso rolls forward; Switch bundle swap |

## New findings (this brief)

- **P2.1 metaphor clash confirmed:** demo:2206 "Be Among the First to **Light a Pot**";
  "Stoke & Win" label (demo:1133). "Slide to ignite" on reveal moments = brand flavour, allowed.
- **P1.2 confirmed:** investor `valueEngine.revenueModels[premiumReveals]` = "Premium AI
  Reveals" revenue line — must be replaced by gift card commissions.
- **P1.1/1.3–1.7 missing:** no elevator pitch block, no competitive landscape, no behaviour-
  change section, no clean-room paragraph, GTM wedge story not explicit.
- **P2.3:** homepage says "friends" once; framing is family-heavy.
- **P2.5:** no Mintel overspend beat.
- **P2.6:** Stack exists in demo (stackNotes) but has no homepage beat.
- **P2.4:** no copy anywhere implies reveal-only-when-full (grep clean) — needs the positive
  framing (event-date reveal + partial-funding choices) made explicit.
- **P4:** no custom 404. No analytics layer. Per-page metadata partial (legal pages have it).

## Execution order

1. **P0** — audit only (all DONE). Log in REVIEW.md. ✅ no code work needed
2. **P1** — investor page: pitch block, revenue correction (remove AI-video line, add gift
   card commissions), two-phase roadmap labels, clean-room paragraph, GTM wedge, competitive
   landscape, behaviour change. JSON + InvestorWarRoom render.
3. **P2** — metaphor fixes (2.1), friends framing (2.3), reveal timing/partial-funding copy
   (2.4), Mintel beat (2.5), Stack homepage beat (2.6).
4. **P4 quick wins** — custom 404, per-page metadata/OG, lightweight consent-gated analytics.
5. **P3 (larger product features)** — kids' circle mode, receiver-view DOM hiding, explainer
   replacement: scoped notes + what ships this pass vs follow-up (see Risks).

## Risks / deliberately deferred

- **P3.1 Kids' Catalogue Mode** and **P3.2 full role-view restructure** are substantial new
  product surfaces inside a 4,000-line demo file; doing them rushed risks breaking the demo.
  This pass ships the P3 items that are copy/structure-safe and logs the rest precisely.
- **Receiver DOM leak (P3.2):** needs verified restructuring of ReceiverPotCard props, not a
  cosmetic fix. Audited and scoped below before any change.
- Deploys continue from this branch only after build + click-test verification.

---

# Sandbox MVP v4.1 — Plan (branch feat/sandbox-mvp-v4)

## Phase 0 dependency audit (v3 pieces)
| Dependency | Status |
|---|---|
| Reveal options (take/stack/switch) | PARTIAL — copy exists (P2.4); interactive screen built here (WS-E minimal) |
| Kids catalogue circle mode + star chart | MISSING (v3 P3.1 deferred) — sandbox uses parent toggle + catalogue picks; circle animation stays deferred |
| Role views w/ surprise redaction | MISSING server-side — **built properly here** (redaction in API layer, unit-tested) |
| Terminology rules | DONE (v3 P2.1) |
| Analytics event layer | DONE (v3 P4.4) — sandbox extends with its own append-only event log |

## Stack & storage decisions
- **DB:** no `DATABASE_URL` in env (founder TODO since v-prev). Decision: a storage
  adapter (`src/lib/sandbox/store.ts`) — Prisma/Postgres models are defined and used
  automatically when `DATABASE_URL` exists; otherwise a process-global in-memory store
  keeps the whole loop working locally/single-instance. **Limitation logged:** on
  serverless (Vercel) the fallback does not persist across cold lambdas — cross-device
  guarantees require the founder to provision Postgres (TODO-FOUNDER). Nothing blocks.
- **Payments:** no Stripe test keys → per the brief's decision rule, **pure-frontend
  simulation**: realistic sheet, pre-filled dummy values, fields never transmitted or
  persisted, "Demo — no money moves" badge. Grep + unit test enforce no card data in
  payloads/stores.
- **Video:** MediaRecorder capture (reusing v-prev KindleRecord patterns); object-URL in
  fallback mode, Vercel Blob when configured (existing media-service). ≤60s cap.
- **Live updates:** polling on pot pages. No websockets.
- **Sharing:** copy-link + native share + WhatsApp intent only (guardrail 3).

## Build order
1. Core lib: types, store adapter, **server-side redaction** (pure fn), event log, seed.
2. API: create pot / get pot (viewer-aware redaction) / contribute / manager view / reset.
3. Mandated tests ×3 (redaction, event rows, no-card-data).
4. WS-A: DEMO banner, `.env.example`, seed + admin reset.
5. WS-B/C: create-pot flow + public pot page + simulated payment sheet + message step +
   WS-D thank-you conversion moment ("Would you rather?" + ref chain).
6. WS-E/F (reveal sim + dashboard): minimal versions this pass; polish next pass.
   v5 (reveal experience) and v6 (films) execute after v4 foundations — sequenced, not
   skipped; each has explicit deps on this branch.

## Risks
- Serverless persistence (above). — Founder DB unblocks fully.
- Scope: WS-E/F/v5/v6 are large; this pass ships the working consumer loop + evidence
  spine first, honestly logged.

---

# Explainer Film System v6 — Plan (branch feat/explainer-v6)

## Phase 0 dependency audit
| Dependency | Status |
|---|---|
| v5 Ignition component | DONE — reused as the films' opening signature |
| Brand tokens | DONE (globals.css / font vars) |
| v3 P1 investor sections (figures to match) | DONE — pitch/£3.2bn/£250k/phases |
| Analytics events | DONE — film_played/film_completed via consent-gated track() |

## Pipeline decision (recorded per brief)
**Remotion rejected for this environment**: it is a heavy dependency whose MP4
renders require headless-Chrome render infrastructure that cannot be run or
verified here, and generated binaries would violate the repo's no-binary-assets
guardrail. **Chosen fallback (explicitly permitted by the brief): code-played
films** — a data-driven FilmPlayer component that plays the scripted, timed
scenes live in the browser (captions-first by design, brand-system visuals,
v5 Ignition opener). The films are watchable/embeddable immediately; producing
MP4/9:16 exports for social is a mechanical step once the founder wants files
(Remotion or screen-capture from the player — scripts are written to exact
timings so nothing is re-authored). TODO-FOUNDER holds that step.

## Security
The investor film's scenes live INSIDE investor-content.json, which is only
served by /api/investor after PIN validation — the investor film cannot appear
in the public bundle, sitemap, or any public route. The customer film is public
data by design.

# v11 — The Sixteen (2026-07-02)

Execution order (dependency-sorted): WS-10/11 theme flip + bubble → WS-5/6/7/8/9/2
demo corrections cluster → WS-16 films + WS-15 investor K-loop → WS-13 /beta →
WS-14 survey → WS-3 paste-a-link → WS-1 occasions → WS-4 star chart → WS-12 logo
audit → completion audit.

## WS-1 occasion mapping (least-disruption design)
Occasion = the existing SandboxPot (internal name unchanged; slug/links unchanged).
Wishes = the pot's items[] (price = per-wish goal). Per-wish progress = new
optional `itemId` on SandboxContribution; contributions without itemId
("wherever it's needed") are auto-assigned server-side to the closest-to-complete
open wish at contribution time. Per-wish granted = attributed sum >= price.
Receiver redaction unchanged (structurally amount-free across all wishes).
Reveal walks items with per-wish outcomes. No schema migration needed (sandbox
state is JSONB); dashboard derives wishes-per-occasion + per-wish velocity from
existing + new events.

## WS-13/14 storage
WaitlistSignup table exists (v9.2). Add SurveyResponse (id, answers Json,
segment, createdAt) via Prisma migration. /beta = client page + POST /api/beta
(BETA_PIN env, server-gated, rate-limited, same pattern as /api/investor);
noindex + robots excluded. Sandbox reset physically cannot touch Postgres tables
(it clears the in-memory store + sandbox_state row only) — asserted by test.

## v11.3 Survey Addendum (patches v11.2, no rebuild)

**Placement decision for Patch 4 (logged, since the brief's anchor question
"how often are you/your kids asked what you want" doesn't exist in the built
survey):** inserted immediately after `q7_landed` ("how many gifts really
landed" — the last general pain question) and before `q8_whipround` (the
first organising/buying-behaviour question). This satisfies the brief's own
stated intent — "prime the theme [q5-q7 general pain], surface the real pain
[new screen A, duplicates/panic], then offer the relief [new screen B,
concept] ... before buying behaviour [q8, whip-round organising]" — using the
closest real equivalents in the actual built question order.

Field ids match the brief's data-model section exactly: `duplicate_pain_experienced`
(multi, parentsOnly) and `curated_list_appeal` (single, parentsOnly). Both
render generically via the existing `parentsOnly` filter in `questionSequence()`
(extended to the multi variant type) — no new branching logic needed.

`q13_concept`'s CONCEPT_PARAGRAPH rendering is generalised from a hardcoded
`q.id === "q13_concept"` check to a `concept?: string` field on the question
object, so the new curated-list question can carry its own paragraph the same
way, cleanly.

Dashboard: both new fields get dedicated panels (not the generic per-question
auto-loop), based on a parents-only completed set independent of the page's
global segment toggle, per the brief's "parents segment only" instruction —
this keeps percentages accurate rather than diluted by buyer-segment rows
that never saw these questions. `curated_list_appeal` is excluded from the
generic single-question auto-loop to avoid a duplicate panel.

**Status: implemented and verified 2026-07-03** — all four patches live in
`src/content/survey.ts`, `src/app/survey/{page,layout}.tsx`,
`src/app/beta/page.tsx`. Full verification detail in REVIEW.md's "v11.3 —
Survey Addendum" section (build green, 130 tests green, both branches
tap-tested live, dashboard panels confirmed against real seeded data).

## v13 — Survey Content + Data Persistence (2026-07-03)

Supersedes v11.2/v11.3/v11.4/v12 per the v13 brief's own instruction — not
reconciling with those, building fresh from the brief's exact spec.

**P0 diagnosis (before writing any code):**

1. *Does prior survey work exist/ship?* Yes — `git log` shows v11.3 as the
   latest and only shipped survey work (commits `557c3d2` original 17-Q
   survey, `53cf2e3` + `0474721` the v11.3 addendum). No v11.4 or v12 commit
   exists anywhere in history (`git log --oneline --all | grep -i "v11.4\|v12"`
   → empty) — those version numbers in the brief's superseding list don't
   correspond to real prior work in this repo; nothing to reconcile.
2. *Is /survey serving the latest build, or a silently rolled-back deploy?*
   No evidence of rollback: every deployment in `vercel ls` (last 5h) shows
   `● Ready`, none failed. In the immediately prior session, the live
   `/survey` route's actual served JS bundle
   (`/_next/static/chunks/app/survey/page-*.js`, fetched directly by URL,
   not via a browser or cache) was grepped and found to contain every v11.3
   string (`duplicate_pain_experienced`, `curated_list_appeal`, the 9-option
   appeal list, the new concept paragraph) — so the build pipeline is
   correctly shipping current `main`. A user report ("survey questions are
   the same") right before this brief arrived is most likely a client-side
   cache/tab-staleness issue on the reporter's device, not a deploy failure
   — but since this can't be fully ruled out from the server side alone,
   this v13 pass proves everything fresh with actual mobile-viewport
   screenshots against the live URL rather than relying on that prior
   bundle-content check.
3. *What is survey/waitlist storage actually implemented as?* Read
   `src/app/api/survey/route.ts`, `src/app/api/signup/route.ts`,
   `src/lib/waitlist.ts`, `src/lib/db.ts`, and `prisma/schema.prisma`
   directly (not assumed from memory): `prisma/schema.prisma`'s datasource
   is `provider = "postgresql"`, `url = env("DATABASE_URL")` — a real
   external Postgres connection string, not SQLite-on-local-disk and not an
   in-memory array. Both routes write via `db.surveyResponse.upsert()` /
   `db.waitlistSignup.upsert()` through the shared Prisma client singleton
   in `src/lib/db.ts`. `DATABASE_URL` is confirmed set for the Production
   Vercel environment (`vercel env ls production`), pointing at a live Neon
   Postgres instance (`ep-dawn-flower-ahtmkrxl...neon.tech`). `/api/beta`'s
   read side queries the same two tables via Prisma, and — importantly —
   the PIN check (`body.pin !== expected`) happens and returns 401 BEFORE
   either `findMany` call runs, so no data can be read pre-auth.
   **Conclusion: storage is already genuinely durable, not ephemeral.**
   Part A is therefore "confirm, don't rebuild" — but per the brief's own
   standard ("proven via the restart test... not assumed"), this still gets
   the full empirical proof in Part D (submit test data → real redeploy →
   confirm survival) rather than being marked done on code-reading alone.

**Part B implementation notes:**

- `src/content/survey.ts` fully replaced (not patched) — new `SurveyQuestion`
  kinds added: `"stepper"` (numeric, min/max/start/topLabel), `"banded"`
  (single-select where each option carries a `mid` value for the calc
  engine), `"calc_wyr"` (Q6's dynamically-generated pair). The old `"single"
  | "multi" | "wyr" | "text"` kinds carry over unchanged in shape.
- Field ids were chosen to match the brief's "complete field list for this
  route" verbatim (`people_bought_for`, `bday_value_band`, `wyr_2yr_choice`,
  etc.) so the data model needs no translation layer between the survey
  content and the dashboard/CSV.
- **Storage decision for WYR answers:** the brief's data model types
  `wyr_kids_choice` as `(A/B/null)`, but the pre-existing "wyr" kind stored
  the literal option text (e.g. "Ten small toys..."). Changed the "wyr"
  renderer to store `"A"`/`"B"` (keyed to the question's original `a`/`b`
  slots, independent of the side-randomised *display* order) so both the
  static Q7 pair and the calculated Q6 pair persist the same shape — this
  also makes the dashboard's head-to-head panels trivial (just count `"A"`
  vs `"B"`) rather than needing to match against literal option strings.
- **"Neither" routing changed**: previously routed to a dead-end "Thanks all
  the same!" screen; now routes straight to the same "done" stage used by
  everyone else, which already contains the Q20 email-capture UI — this
  satisfies "thank-and-end, but still offer the Q20 email step" without a
  separate code path. The now-unused "ended" stage was removed.
- `is_parent` is stored as a genuine JS boolean (not a string), computed at
  screener-selection time from `segment`, matching the brief's `(bool)` type
  exactly — JSON round-trips booleans natively so this needed no backend
  change.
- The intro screen's H1 was changed from "Two minutes on gift-giving?" to "A
  few minutes on gift-giving?" — the old copy would have directly
  contradicted the brief's own required "About 4–5 minutes" line on the same
  screen (the survey is now 20+2 screens, not the previous 17). The OG
  title/description are independently specified by the brief and left
  exactly as given, even though they use a different time figure ("under
  four minutes") than the on-page estimate — that's the brief's own wording
  in two different contexts (a pre-click hook vs. an honest in-flow
  estimate), not something to reconcile.
- Dashboard (`src/app/beta/page.tsx`): added a `Panel` wrapper component to
  cut repetition across the many new panels; added `meanOf`/`medianOf`/
  `histogram` helpers for the two numeric-stepper questions; the two new
  parents-only panels (duplicate/panic pain, curated-list appeal) and the
  new "kids version" WYR panel all use the `parentsCompleted` base
  (independent of the page's segment toggle) for the same reason established
  in v11.3 — otherwise buyer rows who never saw these questions would dilute
  the percentages. `DEDICATED_SINGLE_IDS` now excludes every "single" kind
  question that gets its own titled panel, so the generic per-question
  auto-loop only picks up the ones that don't (asked_frequency,
  group_gift_method, whipround_worst_bit, concept_intent).
- Old `beta-durability.test.ts` survey-branching tests referenced field ids
  that no longer exist after this rewrite (`q13_concept`, `q8_whipround`,
  `q10_wyr_child`, etc.) — replaced entirely with v13-equivalent tests rather
  than patched, plus new tests for the calculation engine (tier boundaries,
  three profiles spanning all four tiers, band-midpoint mapping).
