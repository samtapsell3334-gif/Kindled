"""
Unified market-price lookup: dispatches to the right source (manual value,
or the right API + 12h cache) based on the watchlist row.
"""

from __future__ import annotations

import logging
import sqlite3
from decimal import Decimal

import requests

from kestrel.config import Config
from kestrel.models import PriceSource, WatchlistItem
from kestrel.pricing import pokemon, yugioh
from kestrel.pricing.cache import get_cached_price, normalize_cache_key, set_cached_price

logger = logging.getLogger("kestrel.pricing")

# Recognized `game` values that route to an API price source. Anything else
# with price_source='api' is a configuration error we should surface loudly
# rather than silently skip.
_API_GAMES = {"pokemon", "yugioh"}


def get_market_price_gbp(
    conn: sqlite3.Connection,
    session: requests.Session,
    config: Config,
    item: WatchlistItem,
) -> Decimal | None:
    if item.price_source == PriceSource.MANUAL:
        return item.manual_market_price

    game = (item.game or "").strip().lower()
    if game not in _API_GAMES:
        logger.error(
            "Watchlist row %s has price_source='api' but game=%r is not a "
            "supported API source (%s) — fix the row or set price_source='manual'.",
            item.id,
            item.game,
            ", ".join(sorted(_API_GAMES)),
        )
        return None

    cache_key = normalize_cache_key(game, item.set_name, item.card_number, item.card_name)
    cached = get_cached_price(conn, cache_key, config.price_cache_hours)
    if cached is not None:
        return cached

    price: Decimal | None
    source_name = "pokemontcg.io" if game == "pokemon" else "ygoprodeck"
    try:
        if game == "pokemon":
            price = pokemon.fetch_market_price_gbp(session, config, item.card_name, item.set_name, item.card_number)
        else:
            price = yugioh.fetch_market_price_gbp(session, config, item.card_name)
    except requests.exceptions.RequestException:
        # A network hiccup talking to the pricing API (timeout, DNS,
        # connection reset, ...) should skip this row for this cycle, not
        # crash the whole poll — the next cycle tries again.
        logger.warning("Network error fetching market price for row %s (%s) via %s", item.id, item.card_name, source_name, exc_info=True)
        return None

    if price is None:
        logger.warning("No market price found for watchlist row %s (%s) via %s", item.id, item.card_name, source_name)
        return None

    set_cached_price(conn, cache_key, game, price, source_name)
    return price
