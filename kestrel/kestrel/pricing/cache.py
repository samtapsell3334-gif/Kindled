"""
Shared 12-hour price cache for API-sourced market prices.

Two watchlist rows chasing the same card (or the same row re-polled every
5 minutes) should not re-hit pokemontcg.io / YGOPRODeck on every cycle —
that's how you blow through pokemontcg.io's free 1,000/day limit fast. All
prices are cached here, keyed by a normalized card identity, regardless of
which watchlist row asked for them.
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone
from decimal import Decimal


def normalize_cache_key(game: str, set_name: str | None, card_number: str | None, card_name: str) -> str:
    parts = [game or "", set_name or "", card_number or "", card_name or ""]
    return ":".join(p.strip().lower() for p in parts)


def get_cached_price(conn: sqlite3.Connection, cache_key: str, cache_hours: int) -> Decimal | None:
    row = conn.execute(
        "SELECT market_price_gbp, fetched_at FROM price_cache WHERE cache_key = ?",
        (cache_key,),
    ).fetchone()
    if row is None:
        return None

    fetched_at = datetime.fromisoformat(row["fetched_at"])
    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) - fetched_at > timedelta(hours=cache_hours):
        return None

    return Decimal(row["market_price_gbp"])


def get_last_price_any_age(conn: sqlite3.Connection, cache_key: str) -> Decimal | None:
    """
    The previously cached price for this card, ignoring the 12h TTL — used
    only to sanity-check a freshly-fetched price against, never as a
    substitute for a live fetch. See pricing.get_market_price_gbp's
    anomaly check for why this exists: found live, the same pokemontcg.io
    card ID returned an 18x different trendPrice between a targeted query
    and a bulk-paginated one within a few days, with no real-world reason
    for the swing.
    """
    row = conn.execute(
        "SELECT market_price_gbp FROM price_cache WHERE cache_key = ?",
        (cache_key,),
    ).fetchone()
    return Decimal(row["market_price_gbp"]) if row else None


def set_cached_price(
    conn: sqlite3.Connection,
    cache_key: str,
    game: str,
    market_price_gbp: Decimal,
    source: str,
) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO price_cache (cache_key, game, market_price_gbp, source, fetched_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
            market_price_gbp = excluded.market_price_gbp,
            source = excluded.source,
            fetched_at = excluded.fetched_at
        """,
        (cache_key, game, str(market_price_gbp), source, now),
    )
    conn.commit()
