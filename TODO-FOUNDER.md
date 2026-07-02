# TODO — Founder / Legal (never guessed, always flagged)

Restructured 2026-07-02 on founder instruction ("act as the relevant role,
make decisions and assumptions, complete the list"). Everything completable
was completed and is ticked below with evidence; what remains is the short
"only you" list at the top.

## ONLY YOU — the genuinely non-delegable list
1. **Incorporate the company.** Companies House search (2026-07-02) confirms no
   "Kindled" entity exists. Register it (suggested: Kindled Ltd), then the
   name/number/address drop into /privacy, /terms, /contact and the prize-draw
   rules. Everything else legal is drafted and waiting in **docs/legal-brief.md**
   — engaging a solicitor is now one email with that file attached.
2. **Send docs/legal-brief.md to a solicitor.** The email is pre-written at
   docs/solicitor-email.md — copy, paste, attach the brief, send.
3. **Real-phone acceptance run.** Open kindledgift.co.uk/sandbox on your iPhone
   (Safari) and any Android (Chrome): create a wish → share to a second phone →
   chip in → receiver view → reveal. ~5 minutes per phone. Everything is
   verified in emulation; only real hardware can catch the rest.
4. **Gift-card commercial terms.** Outreach email pre-written at
   docs/retailer-outreach-email.md (aggregator route first: Tillo/Runa). Rates
   are membership-gated, so this needs your send button; the investor page
   correctly stays mechanism-only until contracts exist.
5. **Real photography** when real customers exist (DMCC: no staged
   "customers"). Until then the code-rendered art direction stands.
6. **Neon branch split** before real customer data (checked 2026-07-02: no API
   path — console only): Vercel dashboard → Storage → neon-cerulean-car →
   Open in Neon → Branches → create a "development" branch, then point the
   development env DATABASE_URL at it. Two minutes.

## Legal & compliance — drafted, awaiting the two founder actions above
- [x] Privacy + terms templates complete and published; entity details are the
      only gap (blocked on incorporation). Solicitor brief: docs/legal-brief.md.
- [x] **Prize draw full rules PUBLISHED** (2026-07-02): /terms#prize-draw now
      carries promoter contact, quarterly periods, entry + identical-odds free
      route, eligibility, £2,500 prize, draw method, notification, publication
      and data handling — labelled draft pending counsel + entity.
- [x] **ICO Children's Code assessment WRITTEN**: docs/childrens-code-assessment.md
      maps all 15 standards to the product (first-name-only, parent-mediated,
      no profiling, high-privacy defaults). DPO/counsel to ratify (brief §5).
- [x] Stored credit: perimeter analysis + design constraints documented for
      counsel (brief §3). Wording on-site stays "credit on catalogue purchases".
- [x] Money handling: product intent documented for counsel (brief §2); /terms
      section already matches the Stripe Connect design.
- [x] Video retention + moderation policy drafted (brief §6 + /privacy).

## Claims & figures
- [x] Citations verified & corrected (2026-07-02): Finder UK 2025 set site-wide.
- [x] Gift-card rates: investigated (see ONLY-YOU #4) — mechanism-only stays.
- [x] Use-of-funds split: Build 60% · Growth 25% · Compliance & ops 15% ("planned allocation").
- [x] Video retention: drafted in /privacy (90 days post-reveal + delete-on-request).
- [x] Mintel claim softened + verified to exist; licence check filed in brief.
- [x] Waitlist count: audited 2026-07-02 — no fabricated number anywhere.

## Product / infra
- [x] INVESTOR_PIN set + rate-limited. SANDBOX_ADMIN_SECRET set + rate-limited.
- [x] Vercel Blob provisioned (kindled-media), NEXT_PUBLIC_BLOB_ENABLED=1.
- [x] **Postgres LIVE** (2026-07-02): Neon provisioned via Marketplace (founder
      accepted terms), migrated (3 migrations), sandbox durable — cold-start
      survival proven on production. Per-wish OG previews hydrate from the DB.
- [x] OG image: code-rendered brand art; per-wish OG verified live.
- [x] "Would you rather?" interactive: LIVE in the sandbox post-contribution
      step since v4.1 (investor page labels the roadmap). Item closed.
- [x] Contact email live on /contact; free-entry route uses the same.

## Deferred build items (engineering backlog, not founder blockers — PLAN.md)
- [ ] P3.1 Kids' Catalogue "circle it" mode (must keep parent approval queue —
      see childrens-code-assessment residual action 3).
- [ ] P3.2 demo receiver-view restructure (hidden amounts absent from DOM, not
      hidden by CSS) + add-gift moving to receiver view. Note: the SANDBOX
      receiver view is already server-side redacted; this item is the marketing
      demo only.
- [ ] P2.3 friends-scenario demo pot (mates pooling for a 30th).

## History (v8.1 / v9 / v9.1) — all resolved
- v8.1 noun rename: DONE (founder confirmed "wish" + brand line; routes moved
  with permanent redirects; drift guard bans user-facing "pot").
- v9: crit + Finished Wish layer + Lighthouse (sandbox a11y 100, homepage 96)
  + production screenshot evidence in audit/v9/.
- v9.1: durable sandbox proven live; flushPersist-before-response pattern.
