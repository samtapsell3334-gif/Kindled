"""
SQLite schema and connection helper.

- `watchlist`   — the rules (see build brief: "store the rule, not the
                   price"). One row per card.
- `price_cache` — 12-hour cache of API-sourced market prices, keyed by a
                   normalized card identity. Shared across watchlist rows
                   so two rows chasing the same card don't double the API
                   calls.
- `seen_items`  — eBay item IDs we've already surfaced, so a still-matching
                   listing isn't reprinted every 5-minute cycle.
- `alerts`      — a persisted record of every match, phase 3's "log every
                   listing that triggers an alert" brought forward: it's
                   the foundation for "find me the best deals since our
                   last check" (query reviewed_at IS NULL for what's new)
                   and, later, for re-checking ended auctions' final
                   prices. `reviewed_at`/`review_verdict`/`review_notes`
                   record a deliberate human-or-Claude review pass — things
                   automated matching can't do on its own, like actually
                   looking at the listing photos (see README).
- `graded_prices` — manual per-grade market prices ("this row's card, PSA 9,
                   is worth £120"), keyed per watchlist row. See
                   kestrel/grading.py for why this is manual, not API-sourced.
- `purchases`   — cards actually bought, the "what do I need to list this
                   at to sell it" inventory. See kestrel/purchases.py.

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

CREATE TABLE IF NOT EXISTS alerts (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id                   TEXT NOT NULL,
    watchlist_id              INTEGER NOT NULL REFERENCES watchlist(id),
    card_name                 TEXT NOT NULL,
    game                      TEXT NOT NULL,
    listing_type              TEXT NOT NULL CHECK (listing_type IN ('auction', 'buy_it_now')),
    listing_url               TEXT NOT NULL,
    image_url                 TEXT,
    total_price_gbp           TEXT NOT NULL,
    market_price_gbp          TEXT NOT NULL,
    discount_pct              TEXT NOT NULL,
    condition_hint            TEXT NOT NULL,
    estimated_net_profit_gbp  TEXT NOT NULL,
    net_breakeven_cap_gbp     TEXT NOT NULL,
    detected_at               TEXT NOT NULL,
    -- Populated by a deliberate review pass (see kestrel/alerts.py), not by
    -- the automated poll cycle. NULL reviewed_at is exactly "since our last
    -- check" -- the query the whole review workflow is built around.
    reviewed_at               TEXT,
    review_verdict            TEXT CHECK (review_verdict IN ('looks_good', 'flagged', 'rejected') OR review_verdict IS NULL),
    review_notes              TEXT
);

-- Manual per-grade market prices, one row per (watchlist row, grading
-- company, grade) -- e.g. "this row's Blastoise, PSA 9, is worth £120".
-- Nothing populates this automatically: PSA's own API verifies a cert's
-- authenticity/grade but returns no pricing at any grade, and the only
-- API-legal source that does (PriceCharting) is a paid subscription not
-- wired up. See kestrel/grading.py.
CREATE TABLE IF NOT EXISTS graded_prices (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    watchlist_id      INTEGER NOT NULL REFERENCES watchlist(id),
    grading_company   TEXT NOT NULL,
    grade             TEXT NOT NULL,
    price_gbp         TEXT NOT NULL,
    created_at        TEXT NOT NULL,
    UNIQUE(watchlist_id, grading_company, grade)
);

-- Cards actually bought -- the "what do I need to list this at to sell it"
-- inventory. alert_id links back to the alert that surfaced it when there
-- was one; manual purchases (not sourced from a Kestrel alert) leave it
-- NULL. Market rate and suggested list price are deliberately NOT stored
-- here -- they're refreshed live from the pricing APIs each time the sheet
-- is generated, since a stored price would just go stale. See
-- kestrel/purchases.py.
CREATE TABLE IF NOT EXISTS purchases (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id            INTEGER REFERENCES alerts(id),
    card_name           TEXT NOT NULL,
    game                TEXT NOT NULL,
    set_name            TEXT,
    card_number         TEXT,
    bought_price_gbp    TEXT NOT NULL,
    bought_at           TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'to_list' CHECK (status IN ('to_list', 'listed', 'sold')),
    listed_price_gbp    TEXT,
    sold_price_gbp      TEXT,
    notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_watchlist_active ON watchlist(active);
CREATE INDEX IF NOT EXISTS idx_seen_items_watchlist ON seen_items(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_alerts_reviewed_at ON alerts(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_alerts_watchlist ON alerts(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_graded_prices_watchlist ON graded_prices(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
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
