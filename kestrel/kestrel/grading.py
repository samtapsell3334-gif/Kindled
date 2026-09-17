"""
Grade-aware value comparison: detect a graded-card mention (PSA 9, BGS 9.5,
CGC 10, ...) in a listing's title or condition text, and -- when you've told
Kestrel what that specific card at that specific grade is actually worth --
compare the listing against *that* value instead of the raw/ungraded market
price.

Why this is manual, not another API integration: PSA's public API (see
README) verifies a cert's authenticity and grade -- it does not return
pricing at any grade. The only API-legal source we found that does price by
grade is PriceCharting, a paid subscription that isn't wired up. So this is
a manual table you maintain per watchlist row, the same shape as
WatchlistItem.manual_market_price but keyed by grade.

Purely informational: a grade comparison never changes whether a listing
counts as a match (that's still evaluate_listing's gross, ungraded-price
cap) -- it's a second, more accurate discount figure shown alongside the
existing one once a grade is both detected in the listing and priced here.
"""

from __future__ import annotations

import re
import sqlite3
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from kestrel.models import DetectedGrade, GradedPrice

# Common slab grading companies, then an optional separator, then a grade on
# the standard 1-10 (half-point) scale they all use. Never authoritative --
# same "best-effort signal" spirit as matcher.guess_condition_hint -- and
# deliberately narrow: it won't catch every wording a seller might use.
_GRADE_RE = re.compile(
    r"\b(PSA|BGS|CGC|SGC|ACE)\s*[-#]?\s*(10(?:\.0)?|[1-9](?:\.5)?)\b",
    re.IGNORECASE,
)


def detect_grade(text: str) -> DetectedGrade | None:
    """Best-effort read of a graded-card mention out of free text."""
    match = _GRADE_RE.search(text)
    if not match:
        return None
    return DetectedGrade(company=match.group(1).upper(), grade=Decimal(match.group(2)))


def _canonical_grade(grade: Decimal) -> str:
    """Collapse Decimal("9"), Decimal("9.0") etc. to one comparable form
    ("9", not "9.0") so a lookup can't silently miss on formatting alone."""
    quantized = grade.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
    text = str(quantized)
    return text[:-2] if text.endswith(".0") else text


def set_graded_price(
    conn: sqlite3.Connection,
    watchlist_id: int,
    grading_company: str,
    grade: Decimal,
    price_gbp: Decimal,
) -> int:
    """Insert or update the price for this exact (watchlist row, company,
    grade). Re-running with the same company/grade overwrites the price --
    there's only ever one current price per grade, and values move."""
    company = grading_company.upper()
    canonical = _canonical_grade(grade)
    now = datetime.now(timezone.utc).isoformat()
    existing = conn.execute(
        "SELECT id FROM graded_prices WHERE watchlist_id = ? AND grading_company = ? AND grade = ?",
        (watchlist_id, company, canonical),
    ).fetchone()
    if existing:
        conn.execute(
            "UPDATE graded_prices SET price_gbp = ?, created_at = ? WHERE id = ?",
            (str(price_gbp), now, existing["id"]),
        )
        conn.commit()
        return int(existing["id"])
    cur = conn.execute(
        """
        INSERT INTO graded_prices (watchlist_id, grading_company, grade, price_gbp, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (watchlist_id, company, canonical, str(price_gbp), now),
    )
    conn.commit()
    return int(cur.lastrowid)


def get_graded_price(
    conn: sqlite3.Connection,
    watchlist_id: int,
    grading_company: str,
    grade: Decimal,
) -> Decimal | None:
    row = conn.execute(
        "SELECT price_gbp FROM graded_prices WHERE watchlist_id = ? AND grading_company = ? AND grade = ?",
        (watchlist_id, grading_company.upper(), _canonical_grade(grade)),
    ).fetchone()
    return Decimal(row["price_gbp"]) if row else None


def list_graded_prices(conn: sqlite3.Connection, watchlist_id: int) -> list[GradedPrice]:
    rows = conn.execute(
        "SELECT * FROM graded_prices WHERE watchlist_id = ? ORDER BY grading_company, CAST(grade AS REAL)",
        (watchlist_id,),
    ).fetchall()
    return [
        GradedPrice(
            id=r["id"],
            watchlist_id=r["watchlist_id"],
            grading_company=r["grading_company"],
            grade=Decimal(r["grade"]),
            price_gbp=Decimal(r["price_gbp"]),
            created_at=datetime.fromisoformat(r["created_at"]),
        )
        for r in rows
    ]


def remove_graded_price(conn: sqlite3.Connection, watchlist_id: int, grading_company: str, grade: Decimal) -> None:
    conn.execute(
        "DELETE FROM graded_prices WHERE watchlist_id = ? AND grading_company = ? AND grade = ?",
        (watchlist_id, grading_company.upper(), _canonical_grade(grade)),
    )
    conn.commit()
