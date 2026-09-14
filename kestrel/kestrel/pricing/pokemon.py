"""
Pokemon market pricing via pokemontcg.io (free; 1,000 req/day without an API
key, 20,000/day with one — set POKEMONTCG_API_KEY once the watchlist grows).

pokemontcg.io doesn't return GBP. We prefer the `cardmarket` block (EUR,
European secondary market — closer to a UK eBay comp than the US TCGplayer
figures) and convert with the static FX_EUR_TO_GBP_RATE from config. See
config.py for why this is a static rate rather than a live feed.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

import requests

from kestrel.config import Config

BASE_QUERY_FIELDS = ["cardmarket"]


def _build_query(card_name: str, set_name: str | None, card_number: str | None) -> str:
    clauses = [f'name:"{card_name}"']
    if set_name:
        clauses.append(f'set.name:"{set_name}"')
    if card_number:
        # pokemontcg.io stores just the numerator ("4"), not the collector
        # format most people write ("4/102") — strip the denominator so a
        # watchlist row filled in the normal collector convention still
        # matches instead of silently returning zero results.
        numerator = card_number.split("/", 1)[0].strip()
        clauses.append(f'number:"{numerator}"')
    return " ".join(clauses)


def _extract_price_eur(card: dict[str, Any]) -> Decimal | None:
    cardmarket = card.get("cardmarket") or {}
    prices = cardmarket.get("prices") or {}
    for field in ("trendPrice", "averageSellPrice", "avg30", "avg7"):
        value = prices.get(field)
        if value:
            return Decimal(str(value))
    return None


def fetch_market_price_gbp(
    session: requests.Session,
    config: Config,
    card_name: str,
    set_name: str | None,
    card_number: str | None,
) -> Decimal | None:
    headers = {}
    if config.pokemontcg_api_key:
        headers["X-Api-Key"] = config.pokemontcg_api_key

    resp = session.get(
        f"{config.pokemontcg_base_url}/cards",
        params={"q": _build_query(card_name, set_name, card_number), "pageSize": "5"},
        headers=headers,
        timeout=15,
    )
    if resp.status_code != 200:
        return None

    cards = resp.json().get("data") or []
    if not cards:
        return None

    price_eur = _extract_price_eur(cards[0])
    if price_eur is None:
        return None

    return (price_eur * config.fx_eur_to_gbp).quantize(Decimal("0.01"))
