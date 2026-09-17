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

152 tests cover the matcher (discount/cap math, postage inclusion, auction
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

The equivalent Pokemon pass (Base Set 1st Edition, Base Set, Jungle,
Fossil, Gym Heroes, Neo Genesis, Neo Destiny, 151, Ascended Heroes,
Prismatic Evolutions, Surging Sparks, Evolving Skies, Legendary Collection)
is still pending — pokemontcg.io's API was down (site up, API 500/502)
when this was built.

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
