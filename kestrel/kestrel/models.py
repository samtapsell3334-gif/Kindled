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
