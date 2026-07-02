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
- [x] Citations VERIFIED & CORRECTED (2026-07-02): the £3.2bn "OnePoll/Halifax" and
      1-in-5 "YouGov" figures could not be verified by web search — replaced site-wide
      (homepage, demo, investor page, pitch, film) with Finder UK research, 2025:
      £1.27bn unwanted-gift spend each Christmas · 3 in 5 Brits (58%) · £41/person.
- [ ] **Gift card commission rates** (P1.2): rates and retailer terms unconfirmed — investor
      page states the mechanism only, no rates.
- [x] Use-of-funds split: expert decision (delegated 2026-07-02) — Build 60% · Growth 25% ·
      Compliance & ops 15%, shown as "planned allocation" in the investor film. Override any time.
- [x] Video retention: draft policy added to /privacy (sandbox: deleted on reset; live plan:
      90 days post-reveal + delete-on-request) — legal to confirm.
- [ ] Postgres: provisioning attempt was blocked (billable marketplace transaction needs your
      explicit approval). Two clicks in Vercel → Storage → Postgres/Neon, then I wire it.
- [x] Mintel: report-name claim softened to "Mintel's UK gift-buying research" (Mintel's
      UK gift-buying reports verified to exist via Mintel Store); licence check remains yours.
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
- [x] Contact email: decision taken — sam.tapsell@kindledgift.co.uk (already the repo's
      configured founder address) now live on /contact. Free-entry route uses the same.

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

## v8.1 noun rename ("pot" → "wish") — PAUSED, needs one founder confirmation
- Status: first attempt (2026-07-02) was safely aborted and fully reverted before any
  commit or deploy — a naive phrase sweep corrupted code identifiers (pot.id → wish.id),
  proving the brief's warning right. The live site is untouched and green.
- What's ready to go: route migration plan (/pots/* → /wishes/* with permanent 301s so
  old WhatsApp links work forever), claims.ts noun block, CI banned-list update.
- Needed from you (one message): (1) confirm the noun — "wish" (the brief's
  recommendation) or another; (2) approve or amend the brand line "Kindled — where
  wishes catch light" (the brief requires your sign-off on the exact line).
- Then the rename runs as a string-literal-aware sweep (quoted copy and JSX text only,
  never identifiers), with the read-aloud pass on the top-20 sentences and the
  sum-of-money rephrasings ("pooled together", never a forced noun).

## v9 (2026-07-02)
- audit/v9/CRIT.md contains the graded crit. The harness cannot save binary
  screenshots into the repo, so evidence is written findings + live-verified
  fixes; re-run the walk on a real phone for the before/after gallery if wanted.
- Lighthouse mobile runs (a11y ≥95 target, perf before/after) still need a local
  Chrome run: `npx lighthouse https://www.kindledgift.co.uk/sandbox --form-factor=mobile`.
- A4 (P2, deferred): every primary CTA shares the same amber→orange gradient.
  Deliberate brand ramp for now; revisit in a design-tokens pass.

## v9.1 Durable sandbox (2026-07-02) — one click left
- Code side is DONE and deployed: SandboxState JSONB model in prisma/schema.prisma,
  lazy hydration + debounced write-through in src/lib/sandbox/store.ts, all five
  sandbox API routes hydrate per-request. Without DATABASE_URL it is a no-op.
- [DONE 2026-07-02 — provisioned, migrated, cold-start proof PASS] accept Neon's marketplace terms (their EULA/privacy — a
  legal agreement only you can accept) at
  https://vercel.com/kindled/~/integrations/accept-terms/neon?source=cli
  Then tell Claude "terms accepted" and the rest is automated: create the Neon
  resource, connect it to kindledkindled, set DATABASE_URL, run the migration,
  redeploy, and verify wishes survive a cold start.
