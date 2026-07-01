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
