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
