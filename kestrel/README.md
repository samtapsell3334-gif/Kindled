# Kestrel

A local deal scanner for trading cards. Watches eBay UK for cards on your
watchlist and alerts you when one is priced far enough below market.
**It never bids or buys — every purchase decision is yours.**

**Phases 1 and 2 are built**: watchlist management, eBay polling, console
output, and Telegram alerts with a link straight to the listing. The alert
log / drift detection (phase 3) isn't built yet — see
[Roadmap](#roadmap--not-built-yet).

Kestrel is a standalone Python project, unrelated to and independent of the
Kindled web app elsewhere in this repository. It has its own dependencies,
its own `.env`, and its own SQLite database.

## Setup

```bash
cd kestrel
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt   # includes pytest; use requirements.txt for a leaner runtime-only install

cp .env.example .env
# then edit .env — at minimum set EBAY_CLIENT_ID / EBAY_CLIENT_SECRET

python -m kestrel init-db
```

`EBAY_CLIENT_ID`/`EBAY_CLIENT_SECRET` are your app's **sandbox** keys from
the [eBay Developer Program](https://developer.ebay.com/) — production Buy
API access needs separate eBay approval (see [eBay access](#ebay-access)
below). `POKEMONTCG_API_KEY` is optional (raises the pokemontcg.io limit
from 1,000/day to 20,000/day) — get one free at pokemontcg.io. No key is
needed for YGOPRODeck.

`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` are optional — leave both blank and
Kestrel just prints matches to the console/log instead. To get them:
1. Message [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot`,
   follow the prompts. It replies with a token like `123456789:AAExample...`.
2. Send your new bot any message (e.g. "hi") so it has something to read.
3. Open `https://api.telegram.org/bot<your-token>/getUpdates` in a browser —
   your chat id is at `.result[0].message.chat.id` in the JSON response.

## Usage

```bash
# Add an API-priced row (Pokemon or Yu-Gi-Oh — market price is fetched live)
python -m kestrel watchlist add \
  --game pokemon --card-name "Charizard" --set-name "Base" --card-number "4/102" \
  --price-source api --discount-threshold 0.40 \
  --search-terms "charizard base set 4/102 1999" \
  --exclude-terms "proxy,custom,lot,digital" --tier hot

# Add a manual-priced row (football — no usable price API, per the brief)
python -m kestrel watchlist add \
  --game football --card-name "Some Topps PL Card" \
  --price-source manual --manual-market-price 15.00 --discount-threshold 0.35 \
  --search-terms "topps premier league some card" --tier standard

python -m kestrel watchlist list
python -m kestrel watchlist disable 2     # pause without deleting
python -m kestrel watchlist enable 2
python -m kestrel watchlist remove 2

python -m kestrel poll    # one poll cycle — wire this to cron every 5 min
python -m kestrel run     # or: loop forever in the foreground, sleeping between cycles
```

Cron example (every 5 minutes, matching `POLL_INTERVAL_SECONDS`):

```
*/5 * * * * cd /path/to/kestrel && .venv/bin/python -m kestrel poll >> kestrel.log 2>&1
```

## Tests

```bash
python -m pytest -q
```

200 tests cover the matcher (discount/cap math, postage inclusion, auction
window/bid-count rules, exclusion terms), the call-budgeting scheduler, the
price cache, the two pricing sources (including currency conversion and the
Yu-Gi-Oh set-specific-vs-generic-price logic), the eBay client (token
caching, 429/5xx backoff, filter-string construction), watchlist CRUD/
validation, the Telegram alert formatting (HTML escaping, photo-vs-text
branching, the buy-link button, graceful failure), the alerts log/review
workflow, and the manual grade-vs-value comparison. None of them hit the
network — the eBay, pricing, and Telegram HTTP clients all take an
injectable `requests.Session`-shaped object, swapped for a fake in tests.

## The alerts log and review workflow

Every match is now persisted (`alerts` table), not just printed/sent — the
foundation for a "find me the best deals since our last check" workflow:

```bash
python -m kestrel alerts unreviewed        # what's new since the last review pass
python -m kestrel alerts mark <id> looks_good|flagged|rejected --notes "..."
python -m kestrel alerts best [--limit 10] # reviewed, not-rejected, ranked by net profit
```

The review pass itself is deliberately **not automated** — `reviewed_at IS
NULL` is the query for "since last check", but marking rows reviewed is a
manual (or Claude-assisted) step, on purpose. A real first pass on 12 live
alerts found something no automated check catches: **4 of 12 "genuine 1999
Base Set" listings were actually different printings** —

- 3 were the Pokémon Celebrations **25th Anniversary reprint**, which
  deliberately reuses the exact same card number (`2/102`) as a homage.
  None of the three disclosed this in the title; only the small Pikachu "25"
  stamp visible in the photo gave it away.
- 1 was **Base Set 2** (`2/130`, a real, later, different reprint set) —
  the seller's own title text didn't even match their own photo.

Every automated check passed on all four: title-matching, printing-number
matching, condition data, price math. Only looking at the actual photo
caught it. That's the case for this workflow existing at all — it's not
duplicate checking, it's covering the one gap (see "Images" in the phase 2
section) that nothing else here can close without a paid vision API.

### Day-to-day operating procedure ("go")

The owner's working pattern: open a Claude Code session against this repo
and say **"go"** (or similar — "Jarvis go", "run the scan"). That single
word means run the whole pipeline, unattended except for the final
report:

1. `python -m kestrel poll --workers 8` — full poll cycle against all
   active watchlist rows. If eBay 429s (a real daily quota, not a bug —
   see "Design decisions" below), back off and retry later in the same
   session rather than burning the whole budget hammering it.
2. `python -m kestrel alerts unreviewed`, sorted by `estimated_net_profit_gbp`
   descending — the quick scan.
3. For each new high-profit or ambiguous alert: fetch the listing photo
   from `i.ebayimg.com` (works even when the eBay *search* API is
   rate-limited — separate host, separate limit) and manually verify it's
   a real card, the right printing, and priced against a plausible
   reference. `mark_reviewed` each one (`looks_good` / `flagged` /
   `rejected`, with a one-line reason).
4. Watch for **recurring fake-merchandise patterns** — sellers printing
   "Card not included" / "Slab not included" on display panels, slab-skin
   decals, and fan-art prints that still match a real card's name in
   title search. Several distinct brands of this have been found live
   (CYAN CITY, Border Breakers, CARDAURA, THE ALT ART CO, plus unbranded
   ones) — `matcher.with_merchandise_guard()` catches the ones whose
   *listing title* carries the disclaimer, but several only put it on the
   photo, so this step doesn't fully automate away. If a whole watchlist
   row's reference price looks structurally wrong (not just one bad
   listing — see the Jungle Clefable case), fix it at the source:
   deactivate that row (`watchlist.set_active(conn, item_id, False)`)
   rather than rejecting the same bad alert every cycle.
5. Rebuild the buy list from `alerts best`: rank by profit, prefer one
   copy of each distinct genuine card before adding a second copy of
   anything (real resale demand for a £200+ vintage card is thin — two
   buyers competing to sell the same card is a self-inflicted problem),
   and cap total spend to whatever budget the owner set.
6. Report back: what changed since last time, what's newly confirmed vs.
   newly rejected and why, and the refined buy list.

None of this is scripted end-to-end on purpose — step 3 is the one a
script can't do (see above), so "the whole workflow" still means a Claude
session doing it live, not a cron job. A *separate*, unattended routine
polls on a schedule and reports new alert counts, but explicitly skips
the manual review step — see its own trigger config for what it does and
doesn't do.

## Grade-vs-value comparison

A graded slab (PSA 9, BGS 9.5, CGC 10...) is a different market from a raw
card — the headline discount %, computed against the *raw/ungraded* market
price, is meaningless on a graded listing (it'll usually read as a huge
"discount" because a raw price sits far below what any graded copy is
actually worth). This closes that gap, manually:

```bash
python -m kestrel watchlist grade-price set <id> PSA 9 120.00   # this row's card, PSA 9, is worth £120
python -m kestrel watchlist grade-price list <id>
python -m kestrel watchlist grade-price remove <id> PSA 9
```

Every match still runs through the normal pipeline — title, printing,
price cap — same as always. On top of that, `kestrel/grading.py` reads the
title (and eBay's structured condition text, e.g. `"Graded PSA 9 — Mint"`)
for a graded-card mention (PSA/BGS/CGC/SGC/ACE, standard 1–10 half-point
scale). If one's found **and** you've entered a price for that exact grade
on that watchlist row, the alert carries a second, real comparison —
`graded_market_price_gbp` / `graded_discount_pct` — alongside the existing
gross one, on the console, in Telegram, and via `MatchResult`. No manual
price for the detected grade → nothing changes, same as today.

**Why manual, not another API integration**: this followed directly from
checking what PSA's own public API actually returns (see "Grading
verification (PSA) and full descriptions" below) — cert lookup verifies
*authenticity and grade*, never price. The only API-legal source we found
with real per-grade pricing
is PriceCharting, a $49/mo subscription that isn't wired up (no scraping,
and no untested paid integration going in on spec — see CLAUDE.md's rule
against unvalidated code paths). Given that, a manual table — the same
shape as `WatchlistItem.manual_market_price`, just keyed by grade — is the
one that's actually usable today, and it's what you asked to build.

It's deliberately scoped to *comparison*, not persistence: `graded_prices`
prices don't get written back into the `alerts` log table, since that
table's already live in production with real rows from the review workflow
above, and adding columns to it would need a real migration path this
project doesn't have yet (SQLite's `CREATE TABLE IF NOT EXISTS` is a no-op
against an existing table). The comparison still shows up on every alert
where it applies — console, Telegram, `MatchResult` — it's just not queried
back out of `alerts best` yet.

## The vintage watchlist and the set-specific pricing fix

Building out a bigger watchlist (top-priced cards from Legend of Blue Eyes
White Dragon, Metal Raiders, and Pharaoh's Servant — real early-2000s
first-print Yu-Gi-Oh sets) surfaced a real pricing bug before a single row
went in.

**The bug**: `pricing/yugioh.py` used YGOPRODeck's `card_prices` field,
which blends one card's price across *every* printing it's ever had. For a
card reprinted dozens of times since 2002 (Red-Eyes Black Dragon, say),
that collapses to whatever its cheapest modern reprint costs — **£0.13**,
not the ~£31 a real vintage LOB copy is worth. Every row built on that
price would compare real eBay listings against a near-zero reference and
never fire a single genuine alert — a silent failure, not a crash.

**The fix**: `card_sets[].set_price`, YGOPRODeck's *per-printing* price
field, used when a row has `set_name` (and ideally `card_number` holding
the exact set code, e.g. `LOB-070`, for an unambiguous match). Confirmed
live: Red-Eyes Black Dragon via `LOB-070` → £31.36, vs £0.13 generic. Rows
without a `set_name` (the 4 existing modern Yu-Gi-Oh rows) are unaffected —
they fall back to the old behavior, which is reasonable for cards with few
or no reprints yet.

One real limitation, not fully solved: YGOPRODeck's set-level price still
isn't 1st-Edition-specific — it's a blend across 1st Edition and Unlimited
copies of that same print, and Unlimited is far more common in circulation,
so it likely skews the reference *below* what a genuine 1st Edition copy
is worth. That biases toward **missing** deals rather than false "great
deal" alerts on non-first-edition stock, which is the safer direction, but
it's not a guarantee — check `search_terms` matched "1st edition" and read
the listing before buying, same as everything else in this workflow.

`kestrel/scripts/seed_yugioh_vintage_watchlist.py` built the actual rows:
top-39 LOB / top-40 Metal Raiders / top-40 Pharaoh's Servant by real
set-specific price, excluding anything over £500 raw, `exclude_terms`
including `unlimited` to bias away from non-first-edition listings.
Idempotent — safe to re-run after tweaking the set list or the £500 cap.

**English only, per the brief**: `title_matches_card_name()` only checks
that the English card name appears somewhere in the title — it doesn't
check the physical card is the English print, and both Pokemon and Yu-Gi-Oh
have wide multi-language reprints cross-listed on eBay UK (a bilingual
title like "Charizard 4/102 Glurak Base Set DE" still passes that check).
`matcher.with_non_english_guard()` appends French/German/Italian/Spanish/
Japanese/Korean/Chinese/Portuguese/Dutch/Polish markers (full words and
`(XX)` bracket tags only — deliberately never bare 2-letter codes like "fr"
or "de", which would substring-match "from"/"deal" and silently exclude
huge numbers of genuine English listings) to a row's `exclude_terms`.
Applied to all 131 live rows, and baked into the seed script for future
runs. Not bulletproof — a foreign listing that doesn't label its language
at all won't be caught — but a real improvement over no check at all.

The equivalent Pokemon pass — `kestrel/scripts/seed_pokemon_vintage_watchlist.py`
— is done: top-40 cards (Pokemon-supertype only, Energy/Trainer excluded
per the brief) from Base Set, Jungle, Fossil, Gym Heroes, Neo Genesis, Neo
Destiny, 151, Prismatic Evolutions, Surging Sparks, Evolving Skies, and
Legendary Collection — 354 new rows, 485 active rows total, comfortably
inside the eBay call budget (1125 rows/cycle capacity). "Ascended Heroes"
was dropped — not a real Pokemon TCG set in pokemontcg.io's database, and
never confirmed by the user as anything else.

**"Base Set 1st Edition" and "Base Set" collapse into one set.** Checked
live against the entire Base Set: `tcgplayer.prices` only ever has
`holofoil`/`normal` keys, never a `1stEditionHolofoil` or similar —
pokemontcg.io has no edition-specific pricing split at all (unlike
Yu-Gi-Oh's YGOPRODeck, which does). The reference price is therefore
blended across both editions, and likely skewed toward the far more common
Unlimited copies — meaning it will tend to **undervalue** a genuine 1st
Edition listing, the same safe-direction bias (missed deals over false
positives) as the Yu-Gi-Oh vintage rows above. A real per-card fix needs
manual 1st Edition pricing; not built.

**A second real pricing gap found and fixed along the way**: brand-new
sets can have `cardmarket: null` entirely — confirmed live, every single
card in both Prismatic Evolutions and Surging Sparks had no Cardmarket
(EUR) data at all, only `tcgplayer` (USD). Without a fallback, every card
in a set like that would have silently never priced. `pricing/pokemon.py`
now falls back to `tcgplayer.prices` (preferring holofoil, then
reverseHolofoil, then normal) converted via `FX_USD_TO_GBP_RATE` when
Cardmarket has nothing usable.

**A live poll cycle surfaced a real caveat worth flagging plainly**: one
cycle logged 289 alerts, ~40 of them for a single card (Machamp, Base Set)
at prices from £8–£40 against a £97.05 reference. Checked 3 of the actual
listings directly against eBay's item API — all genuinely described as
authentic 1999 English Base Set cards, not reprints, so this wasn't a
matching bug. The far more likely explanation is Cardmarket's reference
price itself being inflated for that specific card (the same
data-reliability issue as the documented 18x Charizard swing) rather than
275 genuine simultaneous steals. Every one of those alerts scored 60% price
confidence — correctly, since it was each card's first-ever fetch with
nothing yet to cross-check it against (see "Make Offer and price
confidence" below). Practical upshot: a freshly-added row's first alert is
inherently less trustworthy than a repeat one, and a large batch of new
rows can produce a real spike in alert (and Telegram) volume on its first
poll — worth expecting, not a sign anything is broken.

## Make Offer and price confidence

Two more informational fields on every alert, neither of which change
whether a listing counts as a match — the gross, threshold-based cap is
still the only gate.

**Make Offer**: eBay's Buy Browse API reports `buyingOptions`, which can
include `BEST_OFFER` alongside `FIXED_PRICE` — the listing takes a
negotiated price. When it does, `matcher.suggest_offer_gbp()` pitches an
opening offer: `OFFER_NEGOTIATION_MARGIN` (10% by default) below the real
net-breakeven cap, minus postage (Best Offer only negotiates the item
price). Never suggests offering more than the asking price, and returns
nothing when no profitable offer exists at all. Confirmed live: a real
Lugia listing came back "Make Offer accepted — suggest offering £52.70."

**Price confidence**: a heuristic 0–100 score of how much to trust
`market_price_gbp` — explicitly *not* a statistical guarantee, since eBay's
Buy Browse API has no sold-comp data to calculate a real one from. Scored
from process signals that are real and checkable: a manual price (90,
it's your own researched number) scores highest; an API price where the
row pins an exact `set_name` + `card_number` scores 75 normally, 60 on its
very first-ever fetch (nothing to sanity-check against yet); a row missing
that identity (name-only match, ambiguous printing) scores 40; and a fetch
flagged anomalous (≥3x swing vs. the last known price — the same real
18x-swing bug documented above) overrides everything else and drops to 25.
Read it as "how much extra scrutiny this alert's own number deserves," not
as a probability of profit.

## Real-sold-comp cross-check via PriceCharting

Neither of the above fully closes the pricing-reliability gap — cardmarket
and tcgplayer are both "trend"/reference prices, not sold comps, and
`pricing/pokemon.py`'s cardmarket-vs-tcgplayer sanity check only catches a
bad cardmarket number when tcgplayer *disagrees* with it. It can't catch
the two sources quietly agreeing on the same bad number, which happened
live: Raichu, Meowth, Dragonair, and a Yu-Gi-Oh card (Change of Heart, a
different pricing pipeline entirely — `pricing/yugioh.py`) all had
`market_price_gbp` 5x–64x their real value with no internal disagreement
to flag it.

eBay's own real sold-comp API (Marketplace Insights) isn't usable here —
confirmed live, this account's OAuth credentials get a clean `400
invalid_scope` requesting it; it's gated to approved partners. eBay's
public sold-listings *webpage* is also blocked (403 to a direct fetch,
same as the item-detail page — see "Images" section). 130point.com, a
sold-comp aggregator built specifically for trading cards, is blocked too
(403). **PriceCharting.com is fetchable directly** (no API key, robots.txt
allows the price-guide pages) and publishes a real "Ungraded" price point
per card, sourced from tracked sold listings — `pricing/pricecharting.py`
resolves a card by browsing its set's console page
(`/console/<set-slug>`) and matching by collector number, since
PriceCharting's own `/search-products` endpoint is JS-rendered and returns
nothing useful to a direct fetch.

This is a **cross-check tool, not a wired-in pricing source** —
`python -m kestrel alerts cross-check <id>` compares one alert's
`market_price_gbp` against PriceCharting's live number and flags a >3x (or
<1/3x) disagreement. It isn't run automatically on every poll for two
reasons: (1) set-slug mapping is manual per set (`_POKEMON_SET_SLUGS` /
`_YUGIOH_SET_SLUGS` in `pricing/pricecharting.py`) and only the sets this
session actually checked are mapped so far; (2) it makes two page fetches
per card with a polite delay between them, which doesn't scale to a full
poll cycle across ~485 rows without real rate-limiting work. Confirmed
live against the whole buy-list review that triggered building this: 11 of
18 cards agreed with our own price within a reasonable band, 2 disagreed
in the buyer's favour (PriceCharting *higher* — not a red flag, just an
unresolved discrepancy), 2 disagreed enough to need a manual look, and 4
were the confirmed-bad cases above, each fixed by pinning that watchlist
row's `manual_market_price` to the PriceCharting-verified figure (the same
`price_source='manual'` mechanism already used for football cards with no
usable price API).

## Three refinements: slab pricing, currency display, seller trust

Prompted by real questions after the vintage watchlist went live and
started alerting on graded listings.

**Graded listings now gate on their real graded value, not the raw
price.** Previously grade-vs-value was purely cosmetic — every cap/discount
decision used the raw/ungraded reference price regardless of whether the
listing was a slab, so `evaluate_listing` could reject a genuinely
underpriced PSA 9 outright (its asking price above the raw-based cap) even
though it was a real deal against its actual graded value, and it could
also wave through a raw-priced-looking "discount" on a slab that was
actually unremarkable once you accounted for the grade. Fixed: a detected
grade (PSA 9, BGS 9.5, ...) with a manual price entered for that exact
grade now makes the *graded* price the one the cap, discount %, net profit,
and Make Offer suggestion are all computed against — confirmed live: a real
£266.50 PSA 9 Charizard listing matched correctly against a test £400 PSA 9
entry (cap £300), while PSA 3/6/7/7.5/8 listings on the same card (no
manual price entered for those grades) correctly fell back to the raw
reference and were rejected as too expensive against it. When a grade is
detected but has no manual price, the alert still visibly says so — "GRADED
(PSA 9) — no manual price entered" — instead of silently presenting a
raw-based discount % that's likely meaningless for a graded card.

**Currency display is £ everywhere now.** Console/log output previously
mixed `GBP 16.90` (poll output) with `£16.90` (Telegram, `alerts` CLI) —
all now use the £ symbol consistently.

**Seller feedback is now surfaced on every alert.** eBay's item search
already returns `seller.feedbackScore`/`feedbackPercentage` at no extra API
cost — confirmed live: a real £312 "PSA 3" Charizard listing came from a
seller with **0 feedback score, 0.0% rating**, invisible before this
change. Purely informational (never gates a match — a new seller isn't
necessarily a bad one), shown as `Seller: username (N feedback, X%
positive)` so it's part of what you weigh before buying, not a hidden
factor.

**Authenticity/image review is still not automated, and can't be from
here.** It's the one gap nothing in this pipeline closes on its own — see
"The alerts log and review workflow" above. Checking a listing's actual
photos (catching reprint stamps, wrong set numbers, resealed slabs) still
needs a real look, mine or yours, on request (`alerts unreviewed` /
`alerts mark`). Given graded listings are now correctly weighted by real
value, they're also the ones most worth spending that manual review on —
a plausible-looking high grade is exactly the kind of claim worth a second
look before trusting the number.

## Purchases: the "what do I need to list this at" inventory

Separate from alerts (a candidate to maybe buy) and the review workflow
(is this real): a purchase is money already spent. Once you tell me what
you bought, it gets logged here.

```bash
python -m kestrel purchases add-from-alert <alert_id> <price_paid>   # pulls card identity from the alert's watchlist row
python -m kestrel purchases add --card-name ... --game ... --price ...  # manual, no source alert
python -m kestrel purchases list [--status to_list|listed|sold]
python -m kestrel purchases mark-listed <id> <price>
python -m kestrel purchases mark-sold <id> <price>
```

The "master sheet" is generated fresh, not stored: `kestrel/scripts/export_sell_sheet.py`
re-fetches each purchase's **live** market rate at export time (bypassing
`price_cache` deliberately — a handful of one-off "what's this worth now"
checks isn't worth adding staleness for) and computes a suggested list
price and estimated profit using the same fee/postage assumptions the
buying side uses. Confirmed live end-to-end, including retrying through
pokemontcg.io's characteristic transient 500/502s (same fix pattern as the
seed scripts) rather than reporting "no rate" on what's usually a blip.

```bash
python -m kestrel.scripts.export_sell_sheet [output_path]
```

Same caveat as the vintage watchlist's reference prices applies here too:
the market rate shown is whichever Cardmarket/TCGplayer field the pricing
module prefers (trendPrice for Pokemon), which can run high for some
cards — sanity-check against the card's other price signals before
actually listing at the suggested figure.

## Concurrent polling

A real 485-row scan took 50-60 minutes end-to-end, entirely from per-row
network latency (an eBay search + a pricing lookup, each a real round
trip) — never from the eBay call budget, which had huge headroom
throughout (1125 rows/cycle capacity against 485 rows). Sequential
per-row checking was the actual bottleneck, not the budget the scheduler
was built to protect.

```bash
python -m kestrel poll --workers 8
python -m kestrel run --workers 8
```

`poller.run_poll_cycle_concurrent` evaluates rows in parallel instead of
one at a time. Each worker thread opens its own DB connection, eBay
client, and HTTP session — no shared mutable state to race on between
threads. `db.connect()` now sets `PRAGMA journal_mode = WAL` and a
`busy_timeout` so the several concurrent connections to the same file
serialize writes automatically (waiting and retrying) instead of raising
"database is locked". `--workers 1` (the default) keeps the original
sequential `run_poll_cycle` — this is additive, not a replacement.

## Design decisions and things worth flagging

These came up in review before/while building; documenting them here
rather than leaving them silent.

**Currency conversion (not in the original brief).** Neither pricing API
returns GBP. pokemontcg.io's `cardmarket` block is EUR (the European
secondary market — closer to a UK eBay comp than the US `tcgplayer` block,
so it's preferred) and YGOPRODeck's prices are USD. Both are converted to
GBP via **static, config-driven FX rates** (`FX_EUR_TO_GBP_RATE`,
`FX_USD_TO_GBP_RATE` in `.env`) — not a live feed. Update these by hand
periodically; if drift becomes a real problem, a free FX API is the natural
phase-4 addition. Getting this wrong silently would have been the single
easiest way for the whole system to produce garbage alerts, so it's called
out explicitly rather than assumed away.

**Yu-Gi-Oh pricing source.** pokemontcg.io only covers Pokemon. Yu-Gi-Oh
rows (`price_source='api'`) use [YGOPRODeck](https://db.ygoprodeck.com/api-guide/)
instead — free, no key required, aggregates TCGplayer/Cardmarket prices.
Unlike Pokemon, YGOPRODeck prices a card overall rather than per printing,
so `set_name`/`card_number` don't narrow a Yu-Gi-Oh lookup further — only
`card_name` is used.

**pokemontcg.io naming gotcha (found while testing against the live API).**
pokemontcg.io does **not** use collector-format numbers or box-printed set
names:
- `card_number` is stored as just the numerator — `"4"`, not `"4/102"`.
  Kestrel strips everything from `/` onward automatically, so entering the
  watchlist row in normal collector notation (`4/102`) still works.
- `set_name` **is not auto-corrected** and must match pokemontcg.io's own
  set name, which often differs from the name printed on the box — e.g. the
  original 1999 base set is stored as `"Base"`, not `"Base Set"`. Querying
  [`GET /v2/sets`](https://api.pokemontcg.io/v2/sets) (or their card search
  UI) before adding a row is the reliable way to get this right; an
  incorrect `set_name` doesn't error, it just silently returns zero
  results, which means the row never triggers.

**eBay `itemEndDate` filter — the "future dates only" gotcha (found testing
against the real production API, not sandbox).** A two-sided range with
`now` as the lower bound (`itemEndDate:[<now>..<now+10min>]`) is silently
rejected — eBay returns `errorId 12002 ("filter value is invalid")` in the
response's `warnings` array and drops the whole filter, which means every
auction search was quietly returning auctions ending *days* away instead of
minutes, with no visible error. Root cause: eBay requires the range's start
to be strictly in the future, and `now` is already technically past by the
time the request lands on their servers. Fixed by using an **end-only**
range (`itemEndDate:[..<now+10min>]`, no lower bound) — confirmed against
production to return correctly-scoped, real near-term-ending auctions with
zero warnings. Anything already ended is still caught and excluded
client-side by `matcher.evaluate_listing`'s `minutes_remaining` check, so
this was never a risk of alerting on a dead auction — just a risk of
missing genuinely live ones by scanning the wrong 50.

**Title matching is stricter than the brief specified — found because the
first real watchlist batch was flooded with false "deals" (found testing
against production, not sandbox).** eBay's `q` search does loose keyword
matching, not exact-phrase matching, which surfaced two distinct failure
modes once real cards were on the watchlist:
- A search for "ten thousand dragon yugioh" matched "Manju of the Ten
  Thousand Hands" — a different card entirely — at 1% of the real card's
  price, because it shares two of three search words.
- A row tracking the £171 1999 Fossil Gengar (5/62) matched a £2.23 modern
  reprint ("Gengar 050/088 130 HP") — same name, completely different
  printing and price tier, decades apart.

`matcher.title_matches_card_name()` requires the card's actual name to
appear in the listing title (punctuation/case-normalized, so "Ten-Thousand
Dragon" still matches). `matcher.title_matches_printing()` additionally
requires the card_number (or its numerator, with a digit-boundary check so
"5" doesn't match inside "050") when the row has one — Yu-Gi-Oh rows don't,
and always pass. Both run before the price comparison in
`evaluate_listing()`. Neither is foolproof — a seller who mistitles a
listing can still slip through — but they closed off the two concrete
failure modes actually observed.

**Condition awareness — two tiers, and it's still not fully fixable.** A
first real poll returned 20+ "deals" on one card, which turned out to
mostly be genuine copies of the right printing sitting at very different
prices — because eBay's plain `condition` field is useless for trading
cards (nearly every listing is `Ungraded` regardless of actual grade), and
the market price reference has no condition dimension at all.

Two sources now feed `MatchResult.condition_hint`, in priority order:
1. **`EbayClient.get_item_condition_detail()`** — confirmed against
   production: the item *detail* endpoint (a different call from search)
   carries a real, structured, trading-card-specific field
   (`conditionDescriptors` → `"Card Condition"`) with genuine seller-
   declared values ("Heavily played (Poor)") plus specific defect notes
   ("Major creasing", "Fuzzy corners", ...). Far better than guessing.
   Deliberately spent as **one extra API call per match, not per search
   result** — only on listings that already cleared price/title/printing —
   to stay inside the call budget; not currently counted in
   `EbayDailyCallBudget`'s row/cycle math, which assumes 2 calls/row/check,
   since it only fires on actual matches, which are far rarer.
2. **`matcher.guess_condition_hint()`** — a keyword read of the title
   (PSA/BGS/CGC → `graded`, NM → `near mint`, LP → `lightly played`, HP or
   DMG → `damaged`/`heavily played`, prioritized by severity, else `not
   stated`) — used as the initial value, and kept as-is when the detail
   call fails or the structured field isn't present.

Both are surfaced on every alert (console and Telegram) so a big discount %
next to a damaged or heavily-played copy doesn't read as a real deal. This
is still not fully authoritative — a seller can mis-declare condition, and
`not stated` should read as "look closer," not "presumably fine." There's
no way to properly correct the *cap itself* for condition without
per-condition comp data, which is a further reason phase 3's closing-price
log matters — it's the only route to real, condition-aware pricing over
time.

**Grading verification (PSA) and full descriptions — researched, not yet
built.** PSA has a real, free, official public API for cert verification
(register at psacard.com/publicapi, OAuth2 with your PSA login) — pass a
cert number, get back the authoritative card and grade, which would both
improve accuracy and catch fake/mismatched grading labels. Needs its own
account + token, same pattern as the eBay/Telegram setup, so it's not
wired in yet. **BGS and CGC have no official API**, only web lookup pages —
verifying those would mean scraping, which stays off the table per the
brief's own rule. Full listing descriptions are available via the same
item-detail call as condition (confirmed) but tend to be generic seller/
marketplace boilerplate rather than genuine condition detail, so
`conditionDescriptors` was prioritized over parsing description text.

**Net-of-fees resale economics (added beyond the brief).** The headline
discount % is always gross — against market price only, no cost of
actually reselling factored in. At low price points this matters more than
it looks: a card bought for £10 against a ~£17 market (a "40% off" read)
nets roughly **£1.79**, not ~£7, once eBay's ~13% seller fee and a realistic
~£3 outbound postage are taken out — worked out in
`matcher.net_breakeven_cap()` (the most you could pay and still break even)
and `matcher.estimate_net_profit()` (the real estimated profit for this
specific listing's actual price), both shown on every alert alongside the
gross number. `EBAY_SELLER_FEE_RATE` and `RESALE_POSTAGE_GBP` in `.env` are
estimates to tune to your real numbers, not live-looked-up figures — eBay's
actual fee has category nuances and occasional fee-free promotions, and
postage depends on the service you actually use.

This is purely informational and doesn't change whether an alert fires —
that's still the existing gross, threshold-based cap. It also doesn't
replace the condition check above; they answer different questions. A real
example from testing: a listing scored 65.81% off gross with an estimated
£40.47 net profit — genuinely correct arithmetic — but its condition read
as `damaged`, and that profit estimate assumes reselling at the *full*
market price, which isn't realistic for a damaged copy. Read both numbers
together, not the profit estimate alone.

**eBay call-budgeting (added beyond the brief; watchlist expected to reach
40+ rows).** Each watchlist check costs two Browse API calls (Buy It Now
+ Auction are separate searches — see the gotcha below). At a 5-minute
interval that's 288 cycles/day; checking 40+ rows flat, every cycle, blows
past eBay's ~5,000/day application-tier limit almost immediately. Instead
`kestrel/scheduler.py` picks, each cycle, whichever rows have gone longest
without a check (weighted so `tier='hot'` rows are favored over
`standard` when equally overdue), bounded by
`EBAY_DAILY_CALL_BUDGET / cycles_per_day`. A full pass over a large
watchlist then takes a handful of cycles instead of one, rather than
uniformly degrading every row's freshness or silently exceeding the quota.
This is a deliberate design choice, not something the brief specified —
worth re-checking against your actual watchlist size and eBay's actual
confirmed limit for your app once you have one.

**Postage.** The brief calls for including postage in the price comparison.
The search response's own `shippingOptions[].shippingCost` (cheapest option
returned) is used rather than fetching each candidate's full item detail —
that would be a second API call per listing that clears the first filter,
which doesn't fit the call budget above. This is occasionally approximate
(a listing with calculated/location-dependent shipping may show a
different figure at checkout) — flagged here as a known trade-off, not
hidden.

**eBay sandbox has little to no real inventory.** Everything is built and
tested against `EBAY_ENV=sandbox` per the brief, and the OAuth/search/
backoff flow is confirmed working end-to-end against the real sandbox
service (401 on bad credentials, proper token reuse, etc.) — but sandbox
search results won't look like real UK listings. Flip `EBAY_ENV=production`
once Buy API approval lands; no code change needed, just the env var and
production credentials.

**Dedup (`seen_items`).** The brief's "never alert twice on the same item
ID" is a phase 2 (Telegram) requirement, but console output needs the same
thing to be usable — without it, every still-matching listing reprints
every 5-minute cycle. A minimal `seen_items` table (item ID + first-seen
time) is included now; phase 3's full alert log (which re-checks auctions
after they end) is a separate, richer table to be built in that phase, not
this one.

**`active` flag on watchlist rows.** Not in the brief's column list, but
needed to pause a row (e.g. "I found this one, stop checking it for a
while") without losing its configured rule. Rows are enabled by default.

## What phase 2 (Telegram) actually sends

One message per new match (deduplicated via `seen_items`, same as console
output): card name, game, listing type, listing price with postage broken
out, market price, discount %, and — for auctions — current bid, bid count,
time remaining, and the computed max bid as plain copyable text for a
sniping service. The card image is sent as a real Telegram photo (`sendPhoto`)
when the listing has one, falling back to a text message otherwise. Every
message carries one button: **View listing on eBay**, linking straight to
the real listing — Kestrel never bids or buys, that button just opens the
listing in your own browser for you to act on. A Telegram outage or bad
credentials never stops a poll cycle — it logs a warning and console output
still happens regardless.

## Roadmap — not built yet

Per the brief, phase 3 is deliberately **not** scaffolded alongside phases
1 and 2:

- **Phase 3 — Logging, close-price capture, drift detection.** The full
  alert log (every triggering listing, acted on or not), a job that
  re-checks logged auctions after `itemEndDate` and records the final
  price, and the weekly drift job (flag manual-priced cards throwing an
  unusual number of alerts, or none for a long stretch) with a Telegram
  summary.
