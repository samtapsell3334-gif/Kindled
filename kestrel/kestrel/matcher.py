"""
Pure matching logic: given a listing, a watchlist rule, and a market price,
decide whether it's a deal. No I/O here — this is the part that gets unit
tested, per CLAUDE.md's rule that anything touching money needs tests, which
we're following as good practice even though this is a separate codebase
from the Kindled app.

Note on Decimal arithmetic: Kindled's TS convention (`.add()`/`.sub()`/
`.mul()` instead of `+`/`-`/`*`) exists because Prisma's JS `Decimal` class
doesn't overload operators safely. Python's `decimal.Decimal` does overload
them correctly (no float coercion), so plain `+`/`-`/`*`/`/` on `Decimal`
values here is the idiomatic and safe choice — this isn't the JS rule being
ignored, it's a different language with a different Decimal implementation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from kestrel.models import EbayListing, ListingType, MatchResult, WatchlistItem

TWO_PLACES = Decimal("0.01")


def quantize_money(value: Decimal) -> Decimal:
    """Round to 2dp using ROUND_HALF_UP, matching the platform-wide rounding rule."""
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def max_bid(market_price: Decimal, discount_threshold: Decimal) -> Decimal:
    """The price cap: market * (1 - threshold), e.g. market=100, threshold=0.40 -> 60.00."""
    cap = market_price * (Decimal("1") - discount_threshold)
    return quantize_money(cap)


def discount_percentage(total_price: Decimal, market_price: Decimal) -> Decimal:
    """How far below market the total (price + postage) sits, as a percentage."""
    if market_price == 0:
        return Decimal("0")
    pct = (Decimal("1") - (total_price / market_price)) * Decimal("100")
    return pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def title_is_excluded(title: str, exclude_terms: list[str]) -> bool:
    lowered = title.lower()
    return any(term in lowered for term in exclude_terms if term)


def minutes_remaining(item_end_date: datetime, now: datetime | None = None) -> Decimal:
    now = now or datetime.now(timezone.utc)
    delta = item_end_date - now
    return Decimal(delta.total_seconds()) / Decimal("60")


def evaluate_listing(
    listing: EbayListing,
    watchlist_item: WatchlistItem,
    market_price_gbp: Decimal,
    *,
    auction_window_minutes: int,
    auction_max_bid_count: int,
    now: datetime | None = None,
) -> MatchResult | None:
    """
    Return a MatchResult if this listing clears the deal bar for this
    watchlist rule, else None.

    Buy It Now: listed (price + postage) at or below the cap, any time.
    Auction: ends within `auction_window_minutes`, bid count within
    `auction_max_bid_count`, and the current bid + postage is at or below
    the cap.
    """
    if title_is_excluded(listing.title, watchlist_item.exclude_terms_list):
        return None

    cap = max_bid(market_price_gbp, watchlist_item.discount_threshold)
    total_price = listing.total_price

    if listing.listing_type == ListingType.BUY_IT_NOW:
        if total_price > cap:
            return None
    elif listing.listing_type == ListingType.AUCTION:
        if listing.bid_count is None or listing.bid_count > auction_max_bid_count:
            return None
        if listing.item_end_date is None:
            return None
        remaining = minutes_remaining(listing.item_end_date, now=now)
        if remaining < 0 or remaining > auction_window_minutes:
            return None
        if total_price > cap:
            return None
    else:  # pragma: no cover - defensive, ListingType is exhaustive today
        return None

    return MatchResult(
        listing=listing,
        watchlist_item=watchlist_item,
        market_price_gbp=market_price_gbp,
        max_bid_gbp=cap,
        discount_pct=discount_percentage(total_price, market_price_gbp),
    )
