"""
One-off seeding script: add the top-priced cards from a handful of vintage
early-2000s Yu-Gi-Oh sets to the live watchlist, using real per-printing
prices (see kestrel/pricing/yugioh.py for why that had to be fixed first —
the generic card-name price collapses vintage cards to whatever their
cheapest modern reprint costs).

    python -m kestrel.scripts.seed_yugioh_vintage_watchlist          # dry run, prints only
    python -m kestrel.scripts.seed_yugioh_vintage_watchlist --apply  # actually inserts rows

Idempotent: skips any (card_name, set_name) pair that's already an active
watchlist row, so re-running after adjusting SETS/MAX_RAW_PRICE_GBP won't
create duplicates.
"""

from __future__ import annotations

import argparse
import re
import time
from decimal import Decimal

import requests

from kestrel.config import CONFIG
from kestrel.db import get_connection, init_db
from kestrel.matcher import with_non_english_guard
from kestrel.models import PriceSource, Tier
from kestrel.pricing.yugioh import _PLAIN_SET_CODE_RE
from kestrel.watchlist import add_item, list_items

# (YGOPRODeck's exact set_name, how many top-priced cards to keep)
SETS: list[tuple[str, int]] = [
    ("Legend of Blue Eyes White Dragon", 39),
    ("Metal Raiders", 40),
    ("Pharaoh's Servant", 40),
]

# Per the brief: no raw card over this, in GBP.
MAX_RAW_PRICE_GBP = Decimal("500")

# English-only, per the brief: with_non_english_guard() appends the
# French/German/Italian/etc. markers a cross-listed foreign print's title
# tends to carry (see kestrel/matcher.py for why bare 2-letter codes aren't
# used — too many false-positive collisions with ordinary English words).
EXCLUDE_TERMS = with_non_english_guard("proxy,custom,lot,digital,playmat,unlimited")


def _pick_set_entry(card: dict, set_name: str) -> dict | None:
    """Same preference order as yugioh._extract_set_specific_price_gbp when
    no card_number is given yet (we're choosing one here): prefer the plain,
    unsuffixed set_code over region/reprint variants that can be 10x+ off."""
    matches = [cs for cs in (card.get("card_sets") or []) if cs.get("set_name") == set_name]

    def priced(cs: dict) -> Decimal | None:
        raw = cs.get("set_price")
        value = Decimal(str(raw)) if raw not in (None, "") else None
        return value if value and value > 0 else None

    plain = [cs for cs in matches if _PLAIN_SET_CODE_RE.match(cs.get("set_code") or "") and priced(cs)]
    if plain:
        return plain[0]
    any_priced = next((cs for cs in matches if priced(cs)), None)
    return any_priced


def fetch_top_cards(session: requests.Session, set_name: str, limit: int) -> list[dict]:
    resp = session.get(
        f"{CONFIG.ygoprodeck_base_url}/cardinfo.php",
        params={"cardset": set_name},
        timeout=30,
    )
    resp.raise_for_status()
    cards = resp.json().get("data") or []

    rows = []
    for card in cards:
        entry = _pick_set_entry(card, set_name)
        if entry is None:
            continue
        price_usd = Decimal(str(entry["set_price"]))
        price_gbp = (price_usd * CONFIG.fx_usd_to_gbp).quantize(Decimal("0.01"))
        if price_gbp > MAX_RAW_PRICE_GBP:
            continue
        rows.append({
            "card_name": card["name"],
            "set_code": entry["set_code"],
            "price_gbp": price_gbp,
        })

    rows.sort(key=lambda r: r["price_gbp"], reverse=True)
    return rows[:limit]


def _short_label(set_name: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", set_name.lower())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Actually insert rows (default: dry run)")
    args = parser.parse_args()

    init_db(CONFIG.db_path)
    session = requests.Session()

    with get_connection(CONFIG.db_path) as conn:
        existing = {(i.card_name, i.set_name) for i in list_items(conn)}

        total_added = 0
        for set_name, limit in SETS:
            rows = fetch_top_cards(session, set_name, limit)
            print(f"\n=== {set_name} (top {limit}, priced <= £{MAX_RAW_PRICE_GBP}) — {len(rows)} found ===")
            for row in rows:
                key = (row["card_name"], set_name)
                if key in existing:
                    print(f"  skip (already watched): {row['card_name']}")
                    continue
                print(f"  £{row['price_gbp']:>7}  {row['card_name']}  [{row['set_code']}]")
                if args.apply:
                    add_item(
                        conn,
                        game="yugioh",
                        card_name=row["card_name"],
                        set_name=set_name,
                        card_number=row["set_code"],
                        price_source=PriceSource.API,
                        manual_market_price=None,
                        discount_threshold=CONFIG.default_discount_threshold,
                        search_terms=f"{row['card_name']} {_short_label(set_name)} 1st edition yugioh",
                        exclude_terms=EXCLUDE_TERMS,
                        tier=Tier.STANDARD,
                    )
                    total_added += 1
            time.sleep(1)  # be polite to YGOPRODeck between set queries

        if args.apply:
            print(f"\nAdded {total_added} new watchlist rows.")
        else:
            print("\nDry run only — re-run with --apply to actually insert these rows.")


if __name__ == "__main__":
    main()
