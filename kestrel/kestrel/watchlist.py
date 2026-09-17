"""CRUD for the watchlist table, and the sqlite3.Row <-> WatchlistItem mapping."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from decimal import Decimal

from kestrel.models import PriceSource, Tier, WatchlistItem


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    dt = datetime.fromisoformat(value)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def row_to_item(row: sqlite3.Row) -> WatchlistItem:
    return WatchlistItem(
        id=row["id"],
        game=row["game"],
        card_name=row["card_name"],
        set_name=row["set_name"],
        card_number=row["card_number"],
        price_source=PriceSource(row["price_source"]),
        manual_market_price=Decimal(row["manual_market_price"]) if row["manual_market_price"] is not None else None,
        discount_threshold=Decimal(row["discount_threshold"]),
        search_terms=row["search_terms"],
        exclude_terms=row["exclude_terms"] or "",
        tier=Tier(row["tier"]),
        active=bool(row["active"]),
        last_polled_at=_parse_dt(row["last_polled_at"]),
    )


def list_items(conn: sqlite3.Connection, *, active_only: bool = False) -> list[WatchlistItem]:
    query = "SELECT * FROM watchlist"
    if active_only:
        query += " WHERE active = 1"
    query += " ORDER BY id"
    rows = conn.execute(query).fetchall()
    return [row_to_item(r) for r in rows]


def get_item(conn: sqlite3.Connection, item_id: int) -> WatchlistItem | None:
    row = conn.execute("SELECT * FROM watchlist WHERE id = ?", (item_id,)).fetchone()
    return row_to_item(row) if row else None


def add_item(
    conn: sqlite3.Connection,
    *,
    game: str,
    card_name: str,
    set_name: str | None,
    card_number: str | None,
    price_source: PriceSource,
    manual_market_price: Decimal | None,
    discount_threshold: Decimal,
    search_terms: str,
    exclude_terms: str,
    tier: Tier,
) -> int:
    if price_source == PriceSource.MANUAL and manual_market_price is None:
        raise ValueError("manual_market_price is required when price_source='manual'")
    if price_source == PriceSource.API and manual_market_price is not None:
        raise ValueError("manual_market_price must not be set when price_source='api'")

    now = datetime.now(timezone.utc).isoformat()
    cur = conn.execute(
        """
        INSERT INTO watchlist (
            game, card_name, set_name, card_number, price_source,
            manual_market_price, discount_threshold, search_terms,
            exclude_terms, tier, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        """,
        (
            game,
            card_name,
            set_name,
            card_number,
            price_source.value,
            str(manual_market_price) if manual_market_price is not None else None,
            str(discount_threshold),
            search_terms,
            exclude_terms,
            tier.value,
            now,
            now,
        ),
    )
    conn.commit()
    return int(cur.lastrowid)


def set_active(conn: sqlite3.Connection, item_id: int, active: bool) -> None:
    conn.execute(
        "UPDATE watchlist SET active = ?, updated_at = ? WHERE id = ?",
        (1 if active else 0, datetime.now(timezone.utc).isoformat(), item_id),
    )
    conn.commit()


def set_discount_threshold(conn: sqlite3.Connection, item_id: int, threshold: Decimal) -> None:
    if threshold < 0 or threshold >= 1:
        raise ValueError("discount_threshold must be between 0 and 1 (exclusive of 1) — e.g. 0.25 for 25%")
    conn.execute(
        "UPDATE watchlist SET discount_threshold = ?, updated_at = ? WHERE id = ?",
        (str(threshold), datetime.now(timezone.utc).isoformat(), item_id),
    )
    conn.commit()


def set_manual_market_price(conn: sqlite3.Connection, item_id: int, price: Decimal) -> None:
    conn.execute(
        "UPDATE watchlist SET manual_market_price = ?, updated_at = ? WHERE id = ?",
        (str(price), datetime.now(timezone.utc).isoformat(), item_id),
    )
    conn.commit()


def delete_item(conn: sqlite3.Connection, item_id: int) -> None:
    conn.execute("DELETE FROM watchlist WHERE id = ?", (item_id,))
    conn.commit()


def mark_polled(conn: sqlite3.Connection, item_id: int, when: datetime | None = None) -> None:
    when = when or datetime.now(timezone.utc)
    conn.execute(
        "UPDATE watchlist SET last_polled_at = ? WHERE id = ?",
        (when.isoformat(), item_id),
    )
    conn.commit()
