# Kindled — Solicitor instruction brief (drafted 2026-07-02)

Prepared so the founder can engage a solicitor with one email. Everything the
site currently publishes is templated and labelled "pending legal review"; this
brief lists every open question in priority order, with the product facts a
solicitor needs to answer them.

## 0. The product in three sentences
Kindled is a pre-launch UK group-gifting platform: an organiser creates a
"wish" (a shared gift goal), shares one link, friends and family chip in any
amount, and the result is revealed on the big day. Payments will run on Stripe
Connect (Express) with account-to-account rails; the platform fee is 0.5% of
gross plus a 5p processing pass-through. Nothing is live: today the site runs a
simulated-money sandbox only (no real payments, clearly bannered).

## 1. Incorporate the company (blocks items 2–6)
Companies House search (2026-07-02) confirms no "Kindled" entity exists yet.
Needed: company registration (suggested: Kindled Ltd), registered office,
then insertion of company name/number/address into /privacy, /terms, /contact
and the prize-draw rules. Domains (kindledgift.co.uk, kindled.gifts) and the
Stripe/Vercel accounts should be moved into the company's name.

## 2. Money handling (Terms §"How money works")
Confirm and paper: (a) fund custody between contribution and payout — Stripe
Connect connected-account model, platform never holds client money; (b) payout
timing; (c) the goal-not-met outcome (product intends: organiser receives what
was raised, or carries it forward to the next occasion); (d) refund/cancellation
policy vs statutory rights. The published terms must match the Stripe
configuration precisely.

## 3. Stored credit — FCA / e-money perimeter (highest regulatory risk)
The product intends "2% back in credit on catalogue purchases". Current design
constraints (deliberate, to stay outside the e-money perimeter): credit is
non-withdrawable, redeemable only against the user's own wishes on-platform,
and gift money (as opposed to earned credit) is always freely withdrawable.
Question for counsel: does this constitute e-money or a payment service under
the EMRs/PSRs, and if so what changes (or registration) are required before
offering it?

## 4. Prize draw
Full draft rules are now published at /terms#prize-draw (quarterly £2,500 free
prize draw with a no-purchase entry route, one entry per contribution, free
entries treated identically). Counsel to confirm CAP Code Section 8 compliance
and insert promoter identity once the entity exists.

## 5. Children's Code ratification
A self-assessment against the ICO Age Appropriate Design Code is at
docs/childrens-code-assessment.md. Product facts: child wishes are created and
managed exclusively by a parent/guardian; the platform collects the child's
first name only, supplied by the parent; no accounts for children, no
profiling, no behavioural advertising, no geolocation. Counsel/DPO to ratify
and log the assessment.

## 6. UGC retention & moderation (before any public tester round)
Video/photo messages ("Kindle Memories") policy as drafted in /privacy:
sandbox media is deleted on reset; the live plan is deletion 90 days
post-reveal plus immediate delete-on-request. Moderation intent: recipient-
side reporting, organiser can remove any message on their wish, platform
takedown within 48h of report, CSAM escalation per IWF guidance. Counsel to
confirm this meets OSA duties for a UGC-carrying service of this size.

## 7. Standing constraints already enforced in-product
- No fabricated testimonials or statistics (DMCC): everything illustrative is
  badged as example/demo; the only research statistics cited are Finder UK
  (2025) figures, verified 2026-07-02.
- Marketing copy carries no urgency/scarcity patterns.
- Privacy-by-default: surprise wishes are server-side redacted for recipients.
