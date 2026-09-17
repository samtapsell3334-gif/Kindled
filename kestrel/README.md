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

72 tests cover the matcher (discount/cap math, postage inclusion, auction
window/bid-count rules, exclusion terms), the call-budgeting scheduler, the
price cache, the two pricing sources (including currency conversion), the
eBay client (token caching, 429/5xx backoff, filter-string construction),
watchlist CRUD/validation, and the Telegram alert formatting (HTML escaping,
photo-vs-text branching, the buy-link button, graceful failure). None of
them hit the network — the eBay, pricing, and Telegram HTTP clients all take
an injectable `requests.Session`-shaped object, swapped for a fake in tests.

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
