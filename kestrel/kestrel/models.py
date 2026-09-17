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


class PurchaseStatus(str, Enum):
    TO_LIST = "to_list"
    LISTED = "listed"
    SOLD = "sold"


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
    # eBay's "BEST_OFFER" buying option -- the listing accepts a negotiated
    # price alongside (or instead of) its stated one. See
    # matcher.suggest_offer_gbp.
    accepts_best_offer: bool = False
    # Seller trust signals -- present on every item_summary at no extra API
    # cost. A 0-feedback or low-feedback seller on an expensive/graded
    # listing is a real, cheap-to-surface red flag (see README).
    seller_username: str | None = None
    seller_feedback_score: int | None = None
    seller_feedback_pct: Decimal | None = None

    @property
    def total_price(self) -> Decimal:
        """Item price (or current bid, for auctions) plus postage."""
        base = self.current_bid_price if self.listing_type == ListingType.AUCTION else self.item_price
        base = base if base is not None else Decimal("0")
        return base + self.shipping_price


@dataclass
class DetectedGrade:
    """A graded-card mention read out of free text (a title, or eBay's
    condition field) -- e.g. ("PSA", 9). See kestrel/grading.py."""

    company: str
    grade: Decimal


@dataclass
class GradedPrice:
    """One row of a manual per-grade price table for a watchlist item --
    what that exact card is worth at that exact grade, entered by hand
    since no API-legal source returns real per-grade pricing (see
    kestrel/grading.py for why)."""

    id: int
    watchlist_id: int
    grading_company: str
    grade: Decimal
    price_gbp: Decimal
    created_at: datetime


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
    # Grade-aware comparison -- set only when a grade was detected in the
    # title/condition text AND a manual price for that exact grade exists
    # on this watchlist row (kestrel/grading.py). None/None/None otherwise,
    # meaning: no grade comparison available, fall back to discount_pct.
    detected_grade: DetectedGrade | None = None
    graded_market_price_gbp: Decimal | None = None
    graded_discount_pct: Decimal | None = None
    # Set only when listing.accepts_best_offer is True -- see
    # matcher.suggest_offer_gbp for how it's derived. None means either the
    # listing doesn't take offers, or no offer below asking price still
    # clears a genuine margin.
    suggested_offer_gbp: Decimal | None = None
    # Heuristic 0-100 read of how much to trust market_price_gbp -- not a
    # statistical guarantee (there's no sold-comp data behind it), just a
    # transparent score from real, checkable signals: manual entry vs API
    # guess, whether the row's set/number pinned an exact printing, whether
    # this is the very first fetch for this card (nothing to sanity-check
    # against yet), and whether the fetch was flagged anomalous against the
    # last known price. See matcher.price_confidence_pct.
    price_confidence_pct: Decimal | None = None


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


@dataclass
class Purchase:
    """A card actually bought -- the inventory record behind "what do I need
    to list this at to sell it." alert_id links back to the alert that
    surfaced it, when there was one (manual purchases have none). See
    kestrel/purchases.py."""

    id: int
    alert_id: int | None
    card_name: str
    game: str
    set_name: str | None
    card_number: str | None
    bought_price_gbp: Decimal
    bought_at: datetime
    status: PurchaseStatus
    listed_price_gbp: Decimal | None
    sold_price_gbp: Decimal | None
    notes: str | None
