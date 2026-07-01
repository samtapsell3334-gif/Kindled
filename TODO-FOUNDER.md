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
- [ ] **INVESTOR_PIN**: set in Vercel env (currently dev fallback "1066") and add
      rate-limiting/lockout to `/api/investor`.
- [ ] Vercel Blob store + `NEXT_PUBLIC_BLOB_ENABLED=1` to activate durable Memory uploads.
- [ ] Postgres `DATABASE_URL` to activate Memory persistence (`prisma db push`).
- [ ] Real human photography for testimonials/hero when real customers exist.
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
