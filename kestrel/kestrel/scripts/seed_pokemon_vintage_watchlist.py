"""
One-off seeding script: add the top-priced Pokemon cards from a set of
named sets to the live watchlist, English-only, Pokemon-supertype only
(Energy/Trainer excluded per the brief), using the same market-price
extraction the live pricing pipeline uses (kestrel/pricing/pokemon.py).

    python -m kestrel.scripts.seed_pokemon_vintage_watchlist          # dry run, prints only
    python -m kestrel.scripts.seed_pokemon_vintage_watchlist --apply  # actually inserts rows

Idempotent: skips any (card_name, set_name) pair that's already an active
watchlist row, so re-running after adjusting SETS/MAX_RAW_PRICE_GBP won't
create duplicates.

Real limitation, not silently hidden: pokemontcg.io has no 1st-Edition
pricing split. Checked live against the entire Base Set — every card's
`tcgplayer.prices` only ever has `holofoil`/`normal` keys, never
`1stEditionHolofoil` or similar (unlike Yu-Gi-Oh's YGOPRODeck, which does
split by printing — see seed_yugioh_vintage_watchlist.py). "Base Set 1st
Edition" and "Base Set" are therefore the same underlying priced data here;
this script builds one row per Base Set card, not two, and its reference
price is blended across both editions, likely skewed toward the far more
common Unlimited copies. That means it will systematically undervalue a
genuine 1st Edition listing — biasing toward *missing* real 1st Edition
deals rather than false-flagging one, the same safe-direction tradeoff
already made for the Yu-Gi-Oh vintage rows. A precise fix would need manual
per-card 1st Edition pricing (the same pattern as grading.py) or a paid
source like PriceCharting — neither built here.
"""

from __future__ import annotations

import argparse
import time
from decimal import Decimal

import requests

from kestrel.config import CONFIG
from kestrel.db import get_connection, init_db
from kestrel.matcher import with_merchandise_guard, with_non_english_guard, with_reprint_guard
from kestrel.models import PriceSource, Tier
from kestrel.pricing.pokemon import _extract_price_eur, _extract_price_usd
from kestrel.watchlist import add_item, list_items

# (pokemontcg.io set id, short label used in search_terms, how many
# top-priced cards to keep)
SETS: list[tuple[str, str, int]] = [
    ("base1", "base set", 40),
    ("base2", "jungle", 40),
    ("base3", "fossil", 40),
    ("gym1", "gym heroes", 40),
    ("neo1", "neo genesis", 40),
    ("neo4", "neo destiny", 40),
    ("sv3pt5", "151", 40),
    ("sv8pt5", "prismatic evolutions", 40),
    ("sv8", "surging sparks", 40),
    ("swsh7", "evolving skies", 40),
    ("base6", "legendary collection", 40),
]

# Per the brief: no raw card over this, in GBP.
MAX_RAW_PRICE_GBP = Decimal("500")

EXCLUDE_TERMS = with_reprint_guard(with_merchandise_guard(with_non_english_guard("proxy,custom,lot,digital,playmat")))

PAGE_SIZE = 250

# pokemontcg.io's API is noticeably flaky in practice (confirmed live: plain
# 500/502 errors on otherwise-valid requests, unrelated to rate limiting or
# malformed queries — its own status page separately shows the site up).
# Retry with backoff rather than let one transient error abort the whole run.
MAX_RETRIES = 5
RETRY_BACKOFF_SECONDS = 5


def _get_with_retry(session: requests.Session, url: str, params: dict) -> dict:
    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = session.get(url, params=params, timeout=30)
            if resp.status_code == 200:
                return resp.json()
            last_error = requests.exceptions.HTTPError(f"{resp.status_code}: {resp.text[:200]}")
        except requests.exceptions.RequestException as exc:
            last_error = exc
        if attempt < MAX_RETRIES:
            time.sleep(RETRY_BACKOFF_SECONDS)
    raise RuntimeError(f"pokemontcg.io request failed after {MAX_RETRIES + 1} attempts: {last_error}")


def fetch_top_cards(session: requests.Session, set_id: str, limit: int) -> list[dict]:
    all_cards: list[dict] = []
    page = 1
    while True:
        body = _get_with_retry(
            session,
            f"{CONFIG.pokemontcg_base_url}/cards",
            {"q": f"set.id:{set_id} supertype:Pokémon", "pageSize": str(PAGE_SIZE), "page": str(page)},
        )
        batch = body.get("data") or []
        all_cards.extend(batch)
        if len(batch) < PAGE_SIZE or len(all_cards) >= body.get("totalCount", 0):
            break
        page += 1
        time.sleep(1)

    rows = []
    for card in all_cards:
        price_eur = _extract_price_eur(card)
        if price_eur is not None:
            price_gbp = (price_eur * CONFIG.fx_eur_to_gbp).quantize(Decimal("0.01"))
        else:
            # No cardmarket data at all -- confirmed live for brand-new
            # sets (Prismatic Evolutions, Surging Sparks). Fall back to
            # tcgplayer USD rather than silently drop every card in the set.
            price_usd = _extract_price_usd(card)
            if price_usd is None:
                continue
            price_gbp = (price_usd * CONFIG.fx_usd_to_gbp).quantize(Decimal("0.01"))
        if price_gbp <= 0 or price_gbp > MAX_RAW_PRICE_GBP:
            continue
        set_info = card.get("set") or {}
        printed_total = set_info.get("printedTotal")
        number = card.get("number", "")
        card_number = f"{number}/{printed_total}" if printed_total else number
        rows.append({
            "card_name": card["name"],
            "set_name": set_info.get("name", ""),
            "card_number": card_number,
            "price_gbp": price_gbp,
        })

    rows.sort(key=lambda r: r["price_gbp"], reverse=True)
    return rows[:limit]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Actually insert rows (default: dry run)")
    args = parser.parse_args()

    init_db(CONFIG.db_path)
    session = requests.Session()

    with get_connection(CONFIG.db_path) as conn:
        existing = {(i.card_name, i.set_name) for i in list_items(conn)}

        total_added = 0
        for set_id, label, limit in SETS:
            try:
                rows = fetch_top_cards(session, set_id, limit)
            except RuntimeError as exc:
                print(f"\n=== {label} ({set_id}) — SKIPPED after repeated failures: {exc} ===")
                continue
            print(f"\n=== {label} ({set_id}, top {limit}, priced <= £{MAX_RAW_PRICE_GBP}) — {len(rows)} found ===")
            for row in rows:
                key = (row["card_name"], row["set_name"])
                if key in existing:
                    print(f"  skip (already watched): {row['card_name']} ({row['set_name']})")
                    continue
                print(f"  £{row['price_gbp']:>7}  {row['card_name']}  [{row['set_name']} {row['card_number']}]")
                if args.apply:
                    add_item(
                        conn,
                        game="pokemon",
                        card_name=row["card_name"],
                        set_name=row["set_name"],
                        card_number=row["card_number"],
                        price_source=PriceSource.API,
                        manual_market_price=None,
                        discount_threshold=CONFIG.default_discount_threshold,
                        search_terms=f"{row['card_name']} {label} pokemon {row['card_number']}",
                        exclude_terms=EXCLUDE_TERMS,
                        tier=Tier.STANDARD,
                    )
                    existing.add(key)
                    total_added += 1
            time.sleep(1)  # be polite to pokemontcg.io between sets

        if args.apply:
            print(f"\nAdded {total_added} new watchlist rows.")
        else:
            print("\nDry run only — re-run with --apply to actually insert these rows.")


if __name__ == "__main__":
    main()
