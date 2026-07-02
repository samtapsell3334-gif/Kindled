# AUDIT — Sandbox Elevation v7 (branch feat/sandbox-elevation-v7)

Method: full Script-1 walk on the running product at mobile viewport as organiser,
contributor (fresh session) and receiver, via the available browser tooling.
**Evidence constraint (honest):** this environment's screenshot tool returns images
to the reviewing model but cannot write files, so `audit/screens/` holds this note
and evidence below is DOM/API excerpts (permitted by the brief) plus screenshots
reviewed in-session (reveal share beat, sandbox flows — described where cited).
Throttled-4G timing and Lighthouse need a local Chrome run → TODO-FOUNDER.

| # | Rubric item | Grade | Evidence / action |
|---|---|---|---|
| 0.1 | Per-pot OG preview (title/desc/image, server-rendered) | **FIX-P0 → FIXED** | Was: client-only page, generic meta. Now: `p/[slug]/layout.tsx` generateMetadata + dynamic `opengraph-image.tsx`; test asserts title contains pot name, no amounts/items/managerKey. |
| 0.2 | twitter:card = summary_large_image | **FIX-P0 → FIXED** | Was `summary` (root+demo layouts). Now `summary_large_image` everywhere. |
| 0.3 | Brand theme-color | **PASS** | `#0C4E4C` (logo-kit deep teal) in viewport meta since the brand rollout. |
| 0.4 | No sensitive data in previews | **PASS** | Test 4 asserts no amounts/item names; surprise pots share the same safe template. |
| 1.1 | Time-to-meaning above the fold | **PASS** | Pot page renders occasion+date eyebrow, title, progress, single "Chip in for {name}" CTA in first viewport (DOM: `main > p.uppercase, h1, button`). Throttled timing unmeasured → founder Lighthouse run. |
| 1.2 | Emotional warmth | **PASS** | "Chip in for Ava" (named CTA), occasion/date first, sealed-messages line. |
| 1.3 | Ambient social proof | **PASS** | "N contributors · N messages sealed for the big day"; receiver-surprise shows "People are chipping in ✨" with zero numbers (API-verified). |
| 1.4 | No nav clutter; banner unobtrusive | **PASS** | Pot page has no site nav; banner is a single 24px strip. |
| 2.1 | ≤4 screens to share link | **PASS** | One-screen create + celebratory link screen; sensible defaults (date +30d, surprise on). |
| 2.2 | Name-only capture; manager link re-findable | **PASS** | Email optional w/ consent copy; manager link on create screen + My pots page. |
| 2.3 | Parent/star toggles w/ one-line copy; kid catalogue | **PASS** | Toggle filters catalogue to Toys/Games/Sports/Craft; star chart one-liner. |
| 2.4 | Invisible intent capture | **PASS** | category/retailer/price-band captured from catalogue picks; no user-facing fields. |
| 2.5 | Celebratory share + pre-written editable WhatsApp msg | **FIX-P0 → FIXED** | Was: bare link+copy. Now: editable invite message pre-written ("We're all chipping in for {title} — tap to join in 🎉 {link}"), WhatsApp deep link, native share, copy-message. |
| 3.1 | Amount chips anchored, middle pre-selected | **PASS** | £5/10/20/50 + custom; £20 default-selected. |
| 3.2 | ≤6 taps to paid | **PASS** | Chip-in → amount(preset) → continue → pay = 4 taps (name optional). |
| 3.3 | Sheet realistic, badged, prefilled; no double-submit; back-safe | **FIX-P1 → FIXED** | Added `submitting` guard + disabled state ("Sealing…"); read-only prefilled card; badge present. Back mid-flow keeps React state (SPA). |
| 3.4 | Message ask after payment, guilt-free skip | **PASS** | Sequence pays first; "Finish without a message" explicit. |
| 4.1 | Warm framing + camera pre-permission explainer | **FIX-P1 → FIXED** | Added: "Your phone will ask for camera access — only {name} sees the video, at the reveal. Delete or re-record any time." Codec negotiation via MediaRecorder.isTypeSupported already in media-service; on-device iOS/Android runs → founder. |
| 5.1 | Emotional close first; one surface per screen | **PASS** | "You just made {name}'s big day bigger" → WYR card → single persistent start-your-own link. |
| 5.2 | WYR playful; ref chain verified | **PASS** | `?ref=` verified end-to-end in the event log (pot_created.ref) on prod earlier. |
| 5.3 | Persistent polite start-your-own | **PASS** | Post-contribution link + My pots surfaces. |
| 6.x | Reveal beats/pacing/replay/skip/kid/stack maths/strobe | **PASS** | Nine beats verified in-browser (words no-skip fixed in v5); stack projection 31%=£40/£130; canvas embers only, zero flashes. |
| 7.x | Reaction consent/skip; cards; WhatsApp; referral; thank-you | **PASS w/ P2 note** | All present; share clip is a static 9:16 card (auto-stitched VIDEO clip = known deferral, TODO-FOUNDER). |
| 8.1 | Loop closure + next-occasion seed | **PASS w/ P2 note** | Contributor→creator via WYR seed works; explicit "next occasion" seed post-reveal is basic (stack option) — richer prompt queued P2. |
| 8.2 | Event log completeness | **PASS** | Walked journey produced pot_created/item_added/pot_viewed/contribution_started/payment_sheet_viewed/contribution_completed/message_added/wyr_answered/reveal_triggered/reveal_outcome (+v5 share events); dashboard funnel/K reflect it. |
| X.1 | Copy voice + anxiety-point microcopy | **PASS after fixes** | Money: "Demo — no money moves" + new "How the money works" link on the sheet. Camera: new pre-permission line. Who-sees-this: "Only {name} sees this, at the reveal". |
| X.2 | Timing/order; no dead ends | **PASS** | Every screen has one primary action; dead-pot URL lands on designed empty state. |
| X.3 | Animation craft | **PASS** | Springs/canvas embers; reduced-motion paths across loop. 60fps-under-throttle unmeasured here → founder run. |
| X.4 | Images | **PASS** | Brand SVG mark everywhere post-rollout; no broken images encountered on the walk. |
| X.5 | Trust links at capture points | **PASS after fixes** | Privacy link at email capture; money link on sheet; banner everywhere. |
| X.6 | A11y quick-pass | **PASS** | Labels/aria on inputs+controls; reduced-motion global; contrast on new surfaces uses ink-on-cream/white-on-teal pairs. Full Lighthouse ≥95 check → founder run. |
| X.7 | Error/empty states | **PASS w/ P2 note** | Dead pot, camera-deny fallback (text path), double-submit guarded; mid-flow reset message on 404. Offline mid-payment state is browser-default → P2. |

**P0s: 3 found/known, 3 fixed. P1s: 2 found, 2 fixed. P2s noted above (share-clip video, richer next-occasion seed, offline state, founder Lighthouse/throttle runs).**
