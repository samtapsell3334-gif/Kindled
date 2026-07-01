# TODO — Founder / Legal (never guessed, always flagged)

## Legal & compliance
- [ ] **/privacy + /terms templates**: confirm legal entity, company number, registered
      address, data controller, processors list, retention periods; solicitor review.
- [ ] **Prize draw**: publish full rules (promoter identity/address, exact free-entry
      instructions, dates, draw method, winner notification). Confirm quarterly cadence.
- [ ] **ICO Children's Code**: complete an assessment for star-chart / kids' features
      (data minimisation, high-privacy defaults, no child profiling).
- [ ] **Stored credit ("2% back")**: take FCA / e-money / Payment Services advice before
      offering; confirm the real mechanic (currently worded "credit on catalogue purchases").
- [ ] **Money handling**: confirm fund custody, payout timing, goal-not-met outcome and
      refund policy — /terms "How money works" must match reality precisely.

## Claims & figures
- [ ] Verify survey citations used site-wide: YouGov UK Gift Buying Survey 2023 (1 in 5
      duplicates), OnePoll/Halifax 2023 (£3.2bn, 1 in 4 unused). Replace if unverifiable.
- [ ] **Gift card commission rates** (P1.2): rates and retailer terms unconfirmed — investor
      page states the mechanism only, no rates.
- [ ] Mintel UK Gift Purchasing Journey Report 2025 is cited qualitatively (overspend
      pressure). Confirm access/licence to cite it publicly.
- [ ] Waitlist count: only show a number when a real one exists.

## Product / infra
- [x] **INVESTOR_PIN**: DONE — random PIN set in Vercel production env (told to founder
      in chat, 2026-07-01); /api/investor now rate-limited 8 attempts/10min/IP.
- [x] Vercel Blob: DONE — store `kindled-media` created via API, connected to the project (token auto-injected), `NEXT_PUBLIC_BLOB_ENABLED=1` set (2026-07-01).
- [ ] Postgres `DATABASE_URL` to activate Memory persistence (`prisma db push`).
- [ ] Real human photography for testimonials/hero when real customers exist.
- [x] OG image: DONE — code-rendered 1200×630 (`src/app/opengraph-image.tsx`, ember brand),
      replaceable with photographic art direction later.
- [ ] "Would you rather?" interactive: labelled roadmap on the investor page; build the
      public-demo teaser when design capacity allows.
- [ ] Contact email for /contact and prize-draw free-entry route.

## Deferred build items (scoped, not guessed — see PLAN.md)
- [ ] P3.1 Kids' Catalogue "circle it" mode (felt-tip SVG animation, parent approval queue,
      star-chart hookup) — needs its own focused build+QA pass.
- [ ] P3.2 receiver-view restructure so hidden amounts are absent from the receiver DOM
      (verified server/prop-level, not CSS), plus add-gift moving to receiver view.
- [ ] P2.3 friends-scenario demo pot (mates pooling for a 30th) as part of the adult
      receiver view restructure.

## Sandbox v4.1
- [ ] Provision Postgres (DATABASE_URL) — unlocks cross-device persistence (the
      in-memory fallback does not survive serverless cold starts).
- [x] SANDBOX_ADMIN_SECRET: DONE — strong secret set in production env (told to founder
      in chat, 2026-07-01); admin API rate-limited 20 attempts/10min/IP.
- [x] Simulated commission %: expert decision taken — 5% kept and set explicitly in env (mid-range of typical UK B2B gift-card discounts, 4–12%). Revisit only when real retailer terms exist.
- [ ] Video retention/moderation policy before any public tester round.
- [x] Cross-link: expert decision — YES; added in the demo's waitlist card ("Try the working sandbox").
- [x] Staging URL: expert decision — sandbox ships on the production domains (site is pre-launch; demo banner on every sandbox surface makes the simulation explicit).
- [ ] Run acceptance Script 1 on real iOS Safari + Android Chrome phones.
