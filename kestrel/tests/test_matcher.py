from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from kestrel.matcher import (
    discount_percentage,
    evaluate_listing,
    max_bid,
    quantize_money,
    title_is_excluded,
)
from kestrel.models import EbayListing, ListingType, PriceSource, Tier, WatchlistItem

NOW = datetime(2026, 9, 14, 20, 0, 0, tzinfo=timezone.utc)


def make_item(**overrides) -> WatchlistItem:
    defaults = dict(
        id=1,
        game="pokemon",
        card_name="Charizard",
        set_name="Base Set",
        card_number="4/102",
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="charizard base set 4/102",
        exclude_terms="proxy,custom,lot,digital",
        tier=Tier.STANDARD,
        active=True,
        last_polled_at=None,
    )
    defaults.update(overrides)
    return WatchlistItem(**defaults)


def make_bin_listing(**overrides) -> EbayListing:
    defaults = dict(
        item_id="item-1",
        title="Charizard Base Set 4/102 Holo",
        listing_type=ListingType.BUY_IT_NOW,
        item_price=Decimal("50.00"),
        shipping_price=Decimal("3.00"),
        item_web_url="https://ebay.co.uk/itm/1",
        image_url="https://img/1.jpg",
    )
    defaults.update(overrides)
    return EbayListing(**defaults)


def make_auction_listing(**overrides) -> EbayListing:
    defaults = dict(
        item_id="item-2",
        title="Charizard Base Set 4/102 Holo",
        listing_type=ListingType.AUCTION,
        item_price=Decimal("0"),
        shipping_price=Decimal("3.00"),
        item_web_url="https://ebay.co.uk/itm/2",
        image_url=None,
        current_bid_price=Decimal("40.00"),
        bid_count=1,
        item_end_date=NOW + timedelta(minutes=5),
    )
    defaults.update(overrides)
    return EbayListing(**defaults)


class TestMaxBid:
    def test_basic(self):
        assert max_bid(Decimal("100"), Decimal("0.40")) == Decimal("60.00")

    def test_rounds_half_up(self):
        # 33.335 rounds up to 33.34 under ROUND_HALF_UP, not banker's rounding.
        assert quantize_money(Decimal("33.335")) == Decimal("33.34")

    def test_zero_threshold_means_market_price_is_cap(self):
        assert max_bid(Decimal("100"), Decimal("0")) == Decimal("100.00")


class TestDiscountPercentage:
    def test_basic(self):
        assert discount_percentage(Decimal("60"), Decimal("100")) == Decimal("40.00")

    def test_zero_market_price_is_safe(self):
        assert discount_percentage(Decimal("10"), Decimal("0")) == Decimal("0")


class TestTitleExclusion:
    def test_excluded_term_matches_case_insensitively(self):
        assert title_is_excluded("PROXY Charizard card", ["proxy"])

    def test_no_match(self):
        assert not title_is_excluded("Charizard Base Set Holo", ["proxy", "lot"])

    def test_empty_terms_never_excludes(self):
        assert not title_is_excluded("anything", [])


class TestEvaluateBuyItNow:
    def test_matches_when_at_or_under_cap(self):
        item = make_item(discount_threshold=Decimal("0.40"))
        listing = make_bin_listing(item_price=Decimal("57.00"), shipping_price=Decimal("3.00"))  # total 60.00
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is not None
        assert result.max_bid_gbp == Decimal("60.00")
        assert result.discount_pct == Decimal("40.00")

    def test_no_match_over_cap(self):
        item = make_item()
        listing = make_bin_listing(item_price=Decimal("58.00"), shipping_price=Decimal("3.00"))  # total 61.00
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_postage_is_included_in_comparison(self):
        item = make_item()
        # item price alone is under cap, but + postage pushes it over
        listing = make_bin_listing(item_price=Decimal("59.00"), shipping_price=Decimal("5.00"))  # total 64.00
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_excluded_title_never_matches_even_under_cap(self):
        item = make_item()
        listing = make_bin_listing(title="PROXY Charizard", item_price=Decimal("10.00"), shipping_price=Decimal("0"))
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None


class TestEvaluateAuction:
    def test_matches_within_window_and_bid_cap(self):
        item = make_item()
        listing = make_auction_listing(current_bid_price=Decimal("57.00"), bid_count=1)
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is not None

    def test_no_match_too_many_bids(self):
        item = make_item()
        listing = make_auction_listing(bid_count=3)
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_no_match_outside_time_window(self):
        item = make_item()
        listing = make_auction_listing(item_end_date=NOW + timedelta(minutes=30))
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_no_match_already_ended(self):
        item = make_item()
        listing = make_auction_listing(item_end_date=NOW - timedelta(minutes=1))
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_compares_current_bid_not_buy_it_now_price(self):
        item = make_item()
        listing = make_auction_listing(current_bid_price=Decimal("61.00"), bid_count=0)  # + 3 shipping = 64 > 60 cap
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None


class TestManualPriceSource:
    def test_manual_market_price_used_directly(self):
        item = make_item(
            game="football",
            price_source=PriceSource.MANUAL,
            manual_market_price=Decimal("20.00"),
            discount_threshold=Decimal("0.5"),
        )
        listing = make_bin_listing(item_price=Decimal("8.00"), shipping_price=Decimal("2.00"))  # total 10.00
        result = evaluate_listing(
            listing, item, item.manual_market_price, auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is not None
        assert result.max_bid_gbp == Decimal("10.00")
