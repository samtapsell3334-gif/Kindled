"""Plain dataclasses shared across the codebase. No behavior lives here."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from enum import Enum


class PriceSource(str, Enum):
    API = "api"
    MANUAL = "manual"


class Tier(str, Enum):
    HOT = "hot"
    STANDARD = "standard"


class ListingType(str, Enum):
    AUCTION = "auction"
    BUY_IT_NOW = "buy_it_now"


class ReviewVerdict(str, Enum):
    LOOKS_GOOD = "looks_good"
    FLAGGED = "flagged"
    REJECTED = "rejected"


@dataclass
class WatchlistItem:
    id: int
    game: str
    card_name: str
    set_name: str | None
    card_number: str | None
    price_source: PriceSource
    manual_market_price: Decimal | None
    discount_threshold: Decimal
    search_terms: str
    exclude_terms: str  # comma-separated
    tier: Tier
    active: bool
    last_polled_at: datetime | None

    @property
    def exclude_terms_list(self) -> list[str]:
        return [t.strip().lower() for t in self.exclude_terms.split(",") if t.strip()]


@dataclass
class EbayListing:
    """One item_summary result from the Browse API, normalized to GBP-inclusive fields."""

    item_id: str
    title: str
    listing_type: ListingType
    item_price: Decimal
    shipping_price: Decimal
    item_web_url: str
    image_url: str | None
    # Auction-only fields
    current_bid_price: Decimal | None = None
    bid_count: int | None = None
    item_end_date: datetime | None = None

    @property
    def total_price(self) -> Decimal:
        """Item price (or current bid, for auctions) plus postage."""
        base = self.current_bid_price if self.listing_type == ListingType.AUCTION else self.item_price
        base = base if base is not None else Decimal("0")
        return base + self.shipping_price


@dataclass
class MatchResult:
    listing: EbayListing
    watchlist_item: WatchlistItem
    market_price_gbp: Decimal
    max_bid_gbp: Decimal
    discount_pct: Decimal  # e.g. Decimal("42.50") meaning 42.50% below market
    # Best-effort condition read from the listing title (eBay's structured
    # `condition` field is useless for trading cards -- almost everything is
    # "Ungraded" regardless of actual physical grade). See
    # matcher.guess_condition_hint for what this can and can't tell you.
    condition_hint: str = "not stated"
    # Net-of-fees resale economics -- see matcher.estimate_resale_economics
    # for the assumptions (estimated eBay seller fee + return postage cost).
    # Purely informational: doesn't affect whether this counted as a match.
    estimated_net_profit_gbp: Decimal = Decimal("0")
    net_breakeven_cap_gbp: Decimal = Decimal("0")


@dataclass
class AlertRecord:
    """One persisted row from the `alerts` table -- a match, as logged, plus
    whatever a review pass has (or hasn't) recorded about it. See
    kestrel/alerts.py."""

    id: int
    item_id: str
    watchlist_id: int
    card_name: str
    game: str
    listing_type: ListingType
    listing_url: str
    image_url: str | None
    total_price_gbp: Decimal
    market_price_gbp: Decimal
    discount_pct: Decimal
    condition_hint: str
    estimated_net_profit_gbp: Decimal
    net_breakeven_cap_gbp: Decimal
    detected_at: datetime
    reviewed_at: datetime | None
    review_verdict: ReviewVerdict | None
    review_notes: str | None
