"""
The "what do I need to list this at to sell it" inventory: cards actually
bought, tracked from purchase through listing to sale.

Deliberately separate from the alerts/review workflow -- an alert is a
candidate to maybe buy; a purchase is money already spent. Market rate and
a suggested list price are never stored on the row itself (see db.py) --
`refresh_market_rate` re-fetches live each time, using the same pricing
sources (pokemontcg.io / YGOPRODeck) the buying side already relies on, so
a "to sell" sheet never shows a stale number.
"""

from __future__ import annotations

import sqlite3
import time
from datetime import datetime, timezone
from decimal import Decimal

import requests

from kestrel.config import Config
from kestrel.models import Purchase, PurchaseStatus
from kestrel.pricing import pokemon, yugioh
from kestrel.watchlist import get_item

# pokemontcg.io in particular is noticeably flaky in practice (confirmed
# live: plain 500/502 on an otherwise-valid request, gone on retry a few
# seconds later — same characteristic already worked around in the seed
# scripts). A one-off "what's this worth" check deserves a retry rather
# than reporting "no rate" on what's usually a transient blip.
_RETRIES = 3
_RETRY_DELAY_SECONDS = 3


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    dt = datetime.fromisoformat(value)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _row_to_purchase(row: sqlite3.Row) -> Purchase:
    return Purchase(
        id=row["id"],
        alert_id=row["alert_id"],
        card_name=row["card_name"],
        game=row["game"],
        set_name=row["set_name"],
        card_number=row["card_number"],
        bought_price_gbp=Decimal(row["bought_price_gbp"]),
        bought_at=_parse_dt(row["bought_at"]),
        status=PurchaseStatus(row["status"]),
        listed_price_gbp=Decimal(row["listed_price_gbp"]) if row["listed_price_gbp"] is not None else None,
        sold_price_gbp=Decimal(row["sold_price_gbp"]) if row["sold_price_gbp"] is not None else None,
        notes=row["notes"],
    )


def add_purchase(
    conn: sqlite3.Connection,
    *,
    card_name: str,
    game: str,
    set_name: str | None,
    card_number: str | None,
    bought_price_gbp: Decimal,
    alert_id: int | None = None,
    notes: str | None = None,
) -> int:
    now = datetime.now(timezone.utc).isoformat()
    cur = conn.execute(
        """
        INSERT INTO purchases (alert_id, card_name, game, set_name, card_number, bought_price_gbp, bought_at, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'to_list', ?)
        """,
        (alert_id, card_name, game, set_name, card_number, str(bought_price_gbp), now, notes),
    )
    conn.commit()
    return int(cur.lastrowid)


def add_purchase_from_alert(
    conn: sqlite3.Connection,
    alert_id: int,
    bought_price_gbp: Decimal,
    notes: str | None = None,
) -> int:
    """Convenience for the common case: you bought exactly what an alert
    surfaced. Pulls card identity from the alert's own watchlist row (the
    alerts table itself doesn't store set_name/card_number -- see alerts.py)."""
    row = conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if row is None:
        raise ValueError(f"no alert with id {alert_id}")
    item = get_item(conn, row["watchlist_id"])
    if item is None:
        raise ValueError(f"alert {alert_id}'s watchlist row no longer exists")
    return add_purchase(
        conn,
        card_name=row["card_name"],
        game=row["game"],
        set_name=item.set_name,
        card_number=item.card_number,
        bought_price_gbp=bought_price_gbp,
        alert_id=alert_id,
        notes=notes,
    )


def list_purchases(conn: sqlite3.Connection, status: PurchaseStatus | None = None) -> list[Purchase]:
    query = "SELECT * FROM purchases"
    params: tuple = ()
    if status is not None:
        query += " WHERE status = ?"
        params = (status.value,)
    query += " ORDER BY bought_at ASC"
    rows = conn.execute(query, params).fetchall()
    return [_row_to_purchase(r) for r in rows]


def get_purchase(conn: sqlite3.Connection, purchase_id: int) -> Purchase | None:
    row = conn.execute("SELECT * FROM purchases WHERE id = ?", (purchase_id,)).fetchone()
    return _row_to_purchase(row) if row else None


def mark_listed(conn: sqlite3.Connection, purchase_id: int, listed_price_gbp: Decimal) -> None:
    conn.execute(
        "UPDATE purchases SET status = 'listed', listed_price_gbp = ? WHERE id = ?",
        (str(listed_price_gbp), purchase_id),
    )
    conn.commit()


def mark_sold(conn: sqlite3.Connection, purchase_id: int, sold_price_gbp: Decimal) -> None:
    conn.execute(
        "UPDATE purchases SET status = 'sold', sold_price_gbp = ? WHERE id = ?",
        (str(sold_price_gbp), purchase_id),
    )
    conn.commit()


def refresh_market_rate(session: requests.Session, config: Config, purchase: Purchase) -> Decimal | None:
    """
    Live market rate for one purchase, bypassing the price_cache table
    deliberately -- that cache exists to protect the poll cycle's call
    budget across hundreds of watchlist rows; a "what's this worth to sell"
    check is a handful of one-off lookups, not worth adding staleness for.
    """
    game = (purchase.game or "").strip().lower()
    if game == "pokemon":
        fetch = pokemon.fetch_market_price_gbp
    elif game == "yugioh":
        fetch = yugioh.fetch_market_price_gbp
    else:
        return None

    for attempt in range(_RETRIES):
        price = fetch(session, config, purchase.card_name, purchase.set_name, purchase.card_number)
        if price is not None:
            return price
        if attempt < _RETRIES - 1:
            time.sleep(_RETRY_DELAY_SECONDS)
    return None
