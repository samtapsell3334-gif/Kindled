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
6. **Resend account + RESEND_API_KEY** (optional but nice): signups now persist
   to Postgres regardless (v9.2 — they were previously LOST without this key),
   so email notification is a convenience. resend.com → free tier → create API
   key → `npx vercel env add RESEND_API_KEY production`. Your waitlist is
   readable any time at /api/admin/waitlist?secret=<your sandbox admin secret>.
7. **Neon branch split** before real customer data (checked 2026-07-02: no API
   path — console only): Vercel dashboard → Storage → neon-cerulean-car →
   Open in Neon → Branches → create a "development" branch, then point the
   development env DATABASE_URL at it. Two minutes.

## v8.2b colour decision — YOUR PHONE PASS, then one line
- Preview Direction 2 on your phone: open kindledgift.co.uk/?theme=ember-teal
  (sticks for the browsing session; ?theme=legacy switches back). Check hero,
  a wish page, the payment sheet, the reveal.
- Happy? Say "flip the theme" (or edit src/lib/theme.ts DEFAULT_THEME to
  "ember-teal"). Revert is the same single line. OG/share cards follow the flip.

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

## Deferred build items — ALL DONE 2026-07-02
- [x] P3.1 Kids' "circle it": live in the sandbox (felt-tip loop, parent
      approval queue, star-chart line). Every child action routes through the
      parent, per the Children's Code assessment.
- [x] P3.2 demo receiver-view restructure: prop-level redaction via ReceiverPot
      (amounts structurally absent from the recipient DOM), unit-tested.
- [x] P2.3 friends-scenario ("Dan's 30th") example card in the recipient view.

## History (v8.1 / v9 / v9.1) — all resolved
- v8.1 noun rename: DONE (founder confirmed "wish" + brand line; routes moved
  with permanent redirects; drift guard bans user-facing "pot").
- v9: crit + Finished Wish layer + Lighthouse (sandbox a11y 100, homepage 96)
  + production screenshot evidence in audit/v9/.
- v9.1: durable sandbox proven live; flushPersist-before-response pattern.

## v11 (2026-07-02)
- /beta console PIN is 1066 (BETA_PIN env var — change it there any time).
  GDPR: set a retention period for the waitlist + survey tables (suggest:
  review at launch; delete-on-request already applies).
- WhatsApp link previews cache aggressively: after this deploy, share any
  wish link into a chat once to force a re-scrape of the new OG cards.
- The archived film system (/archive/film-system) — permanent deletion is
  your call; it costs nothing where it is.
- Survey test row (sessionId svy_audit_test1) left in the table so the
  dashboard demos with data; delete from /beta CSV workflows when real
  responses arrive.

## v11.3 (2026-07-03)
- Three more test survey rows are in the live table from verifying the new
  "Duplicate & panic pain" / "Curated list appeal" dashboard panels:
  sessionId `test_v113_parent1`, `test_v113_parent2`, `test_v113_buyer1`. I
  asked whether to delete them and you said to leave them for now — flagging
  again here so they don't get mistaken for real responses. Delete via
  Prisma/`/beta` CSV workflow whenever convenient; they're clearly named so
  there's no risk of deleting a real response by mistake.

## v13 (2026-07-03)
- **One more test survey row + two test waitlist signups**, from proving the
  new persistence/redeploy-survival requirement live: sessionId
  `TEST-v13-full-response`, and waitlist emails `test-v13-signup@…` /
  `test-v13-survey@…` (stored lowercased — that's existing, correct
  behaviour, not a bug). All three clearly `TEST-`/`test-` prefixed, so
  there's no risk of deleting a real row by mistake. Left in place
  (consistent with your steer last time) — purge whenever convenient:
  ```
  # From this repo, with DATABASE_URL set (e.g. from .env.local):
  npx tsx -e "
  import { PrismaClient } from '@prisma/client';
  const db = new PrismaClient();
  await db.surveyResponse.deleteMany({ where: { sessionId: 'TEST-v13-full-response' } });
  await db.waitlistSignup.deleteMany({ where: { email: { startsWith: 'test-v13' } } });
  await db.\$disconnect();
  "
  ```
  Or just filter them out by eye in the /beta CSV export — they're the only
  rows starting with `TEST-`/`test-v13`.
- **How to spot-check persistence yourself, any time**: submit anything on
  `/survey` (or the waitlist box on the homepage), then in the Vercel
  dashboard trigger **Deployments → (latest) → Redeploy** — this creates a
  genuinely fresh serverless instance, not just a page refresh. Reload
  `/beta` afterwards with your PIN: if your submission is still there, the
  database connection is real and durable (this is exactly how I proved it
  this session — a live redeploy, not a local test). If it's ever missing
  after a redeploy, that's the signal something's reverted to non-durable
  storage and needs immediate attention.
- The sandbox-reset "survives" proof (Part D of the v13 brief) was verified
  via the existing structural test only, not a live trigger — the admin
  reset endpoint needs `SANDBOX_ADMIN_SECRET`, and I didn't want to keep
  pulling your full production secrets store just to fetch one value (the
  safety system flagged this correctly). The structural test
  (`beta-durability.test.ts`) proves `resetSandbox()` contains zero
  reference to the survey/waitlist tables, which is a stronger guarantee
  than one live observation would be. If you ever want the live version
  proven too, the quickest way is pasting `SANDBOX_ADMIN_SECRET` into a
  session directly, or triggering `POST /api/sandbox/admin` yourself with
  `{"secret":"…","action":"reset"}`.

## v16 (2026-07-03)
- **[TODO: founder to confirm exact fee position]** — the new homepage FAQ
  ("Are there any fees?") deliberately ships with neutral placeholder copy
  rather than a specific figure. `src/lib/fees.ts` has an internal
  calculation already (0.5% platform fee + a flat 5p processing cost,
  deducted from the gross before it reaches the wish — so a contributor
  giving £20 has £20 taken from their card, and the wish receives
  £20 minus that fee), but that's an implementation detail, not something
  I've seen you sign off as a public-facing claim in `content/claims.ts`.
  Once you confirm the exact position you want stated publicly, update the
  FAQ answer in `src/components/FAQSection.tsx` (and consider adding it to
  `content/claims.ts` as the canonical source, matching how the prize draw
  and credit rate already work).
  **Related, found during this session's design audit:** the existing "How
  the money works" section (homepage, `#money`) has a card titled "Every
  penny goes to the goal." I didn't change this — it's defensible read as
  "every contribution counts toward the visible funding target," but it
  sits awkwardly next to the new FAQ's honest "fees not yet confirmed"
  answer, and I don't know whether the wish's progress bar displays the
  gross amount given or the net-of-fee amount. Worth reviewing both pieces
  of copy together once the fee position is confirmed.
- **The founder's note section is a placeholder, deliberately not written
  by me** — `src/components/FounderNote.tsx`, positioned just above the
  final waitlist CTA. This is the one section on the whole site where
  AI-drafted personal narrative would undermine the entire point: it needs
  to be genuinely in your own words. The layout/styling is shipped and
  ready; the copy is clearly marked as a placeholder with prompts (why you
  built this, what personal experience motivated it) for you to replace
  directly in that file whenever you're ready. It will look visibly
  "unfinished/placeholder" until you do — that's deliberate, not a bug.
