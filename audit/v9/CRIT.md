# v9 Sandbox crit — 2026-07-02

Walked the full loop at 375×812 (mobile) as organiser, contributor and receiver
on the live dev build (`/sandbox` → created state → `/p/[slug]` guest →
amount → sheet → message → done → receiver view → manager view → reveal).
Screenshots reviewed live during the walk; the harness cannot save binary
screenshots into the repo, so evidence is captured as findings with exact
file/line references (noted in TODO-FOUNDER).

Grades: PASS / FIX-P0 / FIX-P1 / FIX-P2.

## A. Scam-signal audit

| # | Finding | Where | Grade |
|---|---|---|---|
| A1 | No provenance on the wish page: a stranger opening a share link sees no "who made this" | `p/[slug]/page.tsx` header | **FIX-P0** |
| A2 | Input reasons live in placeholders, so they vanish the moment you type ("Your name (shown at the reveal)", "So contributors know who's organising") | contribute amount step; create step 4 | **FIX-P1** |
| A3 | Payment sheet trust copy is scattered across three fragments (badge, two-line caption, link) | sheet step | **FIX-P1** |
| A4 | Identical default Tailwind amber→orange gradient on every primary button reads generic | all sandbox CTAs | FIX-P2 (kept: brand ember ramp is deliberate; noted for the design-tokens pass) |
| A5 | Urgency/scarcity patterns | whole loop | **PASS** — none found |
| A6 | Exclamation stacking / hype superlatives | whole loop | **PASS** (one "Share the link!" retained, warm not urgent) |
| A7 | Polish edges: 404 state designed, loading state designed, disabled states present, per-wish tab titles, favicon current | various | **PASS** |
| A8 | Emoji budget: receiver line used ✨ twice in one sentence position | receiver view | **FIX-P1** |

## B. Ask-and-workflow sense audit

| # | Finding | Where | Grade |
|---|---|---|---|
| B1 | Contribute flow has no orientation: amount → sheet → message with no "Step 1 of 3" | `p/[slug]` flow | **FIX-P1** |
| B2 | Every field justified-now check: amount (now, ok), name (used at reveal — reason must persist, see A2), message (after payment ✓ deferred correctly), email (deferred to create step 4, optional, reasoned ✓) | loop | PASS after A2 |
| B3 | Dead ends: receiver view offers nothing to do or feel beyond two lines of text | receiver view | **FIX-P0** (fixed by WS-2.3 teaser) |
| B4 | Reading level: all screens one-pass readable on the bus test | loop | **PASS** |
| B5 | Empty list on create can be submitted (a wish with no items and £0 goal renders oddly) | create → submit | **FIX-P1** (nudge, not block: joint cash goals are legitimate) |

## C. Outcome-visibility audit (core lens)

| # | Screen | Outcome present? | Grade |
|---|---|---|---|
| C1 | Create page | No. Nothing shows what a finished wish looks like | **FIX-P0** → examples gallery (WS-2.4) |
| C2 | Wish page (guest/manager) | Numbers and a grey list; the gift never materialises | **FIX-P0** → MaterialisingGift (WS-2.1) |
| C3 | Amount step | Chips are naked amounts; no impact preview | **FIX-P0** → impact framing (WS-2.2) |
| C4 | Done beat | Text-only thanks; contributor never sees their money become the thing | **FIX-P0** → outcome beat (WS-2.2) |
| C5 | Receiver view | Ambient text only; no anticipation object | **FIX-P0** → big-day teaser (WS-2.3) |
| C6 | Completed/revealed wish | A green info box — the weakest-looking state on the site, should be the strongest | **FIX-P0** → granted state (WS-2.5) |

## D. Fun-quotient audit

| # | Finding | Grade |
|---|---|---|
| D1 | Chip-in success has zero physical feedback (no motion, no haptic) | **FIX-P1** → ember beat (WS-3) |
| D2 | Progress bar is static; nothing breathes while a wish is active | **FIX-P1** → breathing glow (WS-3) |
| D3 | Milestones (50%, almost-there) pass silently | **FIX-P1** → one-line flare (WS-3) |
| D4 | Reveal experience (v5) | **PASS** — already carries the motion language |
| D5 | Decoration-only motion | **PASS** — none found in sandbox (nothing moves at all, which is D1–D3) |

## Fix order
P0: A1, B3/C5, C1, C2, C3, C4, C6 → then P1: A2, A3, A8, B1, B5, D1, D2, D3.
