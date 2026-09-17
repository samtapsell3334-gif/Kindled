"""
The persisted alert log (phase 3's foundation, brought forward) and the
review workflow built on it: "find me the best deals since our last check."

`log_alert` runs automatically, once per match, inside the poll cycle.
`list_unreviewed` / `mark_reviewed` / `list_best` are for the review pass
itself -- which is deliberately *not* automated here. Looking at a listing's
actual photos and catching a mismatch (found live: a listing's photo showed
180 HP on a card whose real printing has 80 HP -- title-matching, condition
data and price math all passed, only the photo caught it) needs a real look,
not more regex. This module just gives that review something clean to work
from and somewhere to record what it found.
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from decimal import Decimal

from kestrel.models import AlertRecord, ListingType, MatchResult, ReviewVerdict


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    dt = datetime.fromisoformat(value)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _row_to_record(row: sqlite3.Row) -> AlertRecord:
    return AlertRecord(
        id=row["id"],
        item_id=row["item_id"],
        watchlist_id=row["watchlist_id"],
        card_name=row["card_name"],
        game=row["game"],
        listing_type=ListingType(row["listing_type"]),
        listing_url=row["listing_url"],
        image_url=row["image_url"],
        total_price_gbp=Decimal(row["total_price_gbp"]),
        market_price_gbp=Decimal(row["market_price_gbp"]),
        discount_pct=Decimal(row["discount_pct"]),
        condition_hint=row["condition_hint"],
        estimated_net_profit_gbp=Decimal(row["estimated_net_profit_gbp"]),
        net_breakeven_cap_gbp=Decimal(row["net_breakeven_cap_gbp"]),
        detected_at=_parse_dt(row["detected_at"]),
        reviewed_at=_parse_dt(row["reviewed_at"]),
        review_verdict=ReviewVerdict(row["review_verdict"]) if row["review_verdict"] else None,
        review_notes=row["review_notes"],
    )


def log_alert(conn: sqlite3.Connection, match: MatchResult) -> int:
    """Persist one match. Called once per alert from poller.run_poll_cycle,
    in addition to (not instead of) the console/Telegram output."""
    now = datetime.now(timezone.utc).isoformat()
    cur = conn.execute(
        """
        INSERT INTO alerts (
            item_id, watchlist_id, card_name, game, listing_type, listing_url,
            image_url, total_price_gbp, market_price_gbp, discount_pct,
            condition_hint, estimated_net_profit_gbp, net_breakeven_cap_gbp,
            detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            match.listing.item_id,
            match.watchlist_item.id,
            match.watchlist_item.card_name,
            match.watchlist_item.game,
            match.listing.listing_type.value,
            match.listing.item_web_url,
            match.listing.image_url,
            str(match.listing.total_price),
            str(match.market_price_gbp),
            str(match.discount_pct),
            match.condition_hint,
            str(match.estimated_net_profit_gbp),
            str(match.net_breakeven_cap_gbp),
            now,
        ),
    )
    conn.commit()
    return int(cur.lastrowid)


def list_unreviewed(conn: sqlite3.Connection) -> list[AlertRecord]:
    """Everything logged since the last review pass -- reviewed_at IS NULL
    *is* "since our last check", not a separate bookmark to maintain."""
    rows = conn.execute("SELECT * FROM alerts WHERE reviewed_at IS NULL ORDER BY detected_at ASC").fetchall()
    return [_row_to_record(r) for r in rows]


def get_alert(conn: sqlite3.Connection, alert_id: int) -> AlertRecord | None:
    row = conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    return _row_to_record(row) if row else None


def mark_reviewed(
    conn: sqlite3.Connection,
    alert_id: int,
    verdict: ReviewVerdict,
    notes: str | None = None,
) -> None:
    conn.execute(
        "UPDATE alerts SET reviewed_at = ?, review_verdict = ?, review_notes = ? WHERE id = ?",
        (datetime.now(timezone.utc).isoformat(), verdict.value, notes, alert_id),
    )
    conn.commit()


def list_best(conn: sqlite3.Connection, limit: int = 10) -> list[AlertRecord]:
    """Reviewed, not rejected, ranked by estimated net profit -- the actual
    "find me the best deals" answer. Flagged items are included (with their
    notes) rather than hidden, since "flagged" often means "worth a second
    look, not a scam" (e.g. condition worse than the discount suggests) --
    the number still matters, just read the notes."""
    rows = conn.execute(
        """
        SELECT * FROM alerts
        WHERE reviewed_at IS NOT NULL AND review_verdict != 'rejected'
        ORDER BY CAST(estimated_net_profit_gbp AS REAL) DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [_row_to_record(r) for r in rows]
