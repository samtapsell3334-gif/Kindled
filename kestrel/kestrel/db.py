"""
SQLite schema and connection helper.

Phase 1 needs three tables:

- `watchlist`   — the rules (see build brief: "store the rule, not the
                   price"). One row per card.
- `price_cache` — 12-hour cache of API-sourced market prices, keyed by a
                   normalized card identity. Shared across watchlist rows
                   so two rows chasing the same card don't double the API
                   calls.
- `seen_items`  — eBay item IDs we've already surfaced, so a still-matching
                   listing isn't reprinted every 5-minute cycle. This is
                   deliberately minimal for phase 1 (just enough for usable
                   console output); phase 3's full alert log ("log every
                   listing that triggers an alert... re-check after it
                   ends") is a separate, richer table built in that phase.

All money is stored as TEXT and parsed back into `decimal.Decimal` — sqlite
has no fixed-point type, and round-tripping through REAL/float would defeat
the entire point of using Decimal in the application layer.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

SCHEMA = """
CREATE TABLE IF NOT EXISTS watchlist (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    game                  TEXT NOT NULL,
    card_name             TEXT NOT NULL,
    set_name              TEXT,
    card_number           TEXT,
    price_source          TEXT NOT NULL CHECK (price_source IN ('api', 'manual')),
    manual_market_price   TEXT,
    discount_threshold    TEXT NOT NULL DEFAULT '0.40',
    search_terms          TEXT NOT NULL,
    exclude_terms         TEXT NOT NULL DEFAULT '',
    tier                  TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('hot', 'standard')),
    active                INTEGER NOT NULL DEFAULT 1,
    last_polled_at        TEXT,
    created_at            TEXT NOT NULL,
    updated_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS price_cache (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key         TEXT NOT NULL UNIQUE,
    game              TEXT NOT NULL,
    market_price_gbp  TEXT NOT NULL,
    source            TEXT NOT NULL,
    fetched_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seen_items (
    item_id         TEXT PRIMARY KEY,
    watchlist_id    INTEGER NOT NULL REFERENCES watchlist(id),
    listing_type    TEXT NOT NULL CHECK (listing_type IN ('auction', 'buy_it_now')),
    first_seen_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_watchlist_active ON watchlist(active);
CREATE INDEX IF NOT EXISTS idx_seen_items_watchlist ON seen_items(watchlist_id);
"""


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(db_path: Path) -> None:
    conn = connect(db_path)
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


@contextmanager
def get_connection(db_path: Path) -> Iterator[sqlite3.Connection]:
    """Context-managed connection that commits on success, rolls back on error."""
    conn = connect(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
