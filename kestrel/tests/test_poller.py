from datetime import datetime, timezone
from decimal import Decimal

from kestrel.models import EbayListing, ListingType, MatchResult, PriceSource, Tier, WatchlistItem
from kestrel.poller import _enrich_condition_from_item_detail

NOW = datetime(2026, 9, 14, 20, 0, 0, tzinfo=timezone.utc)


class FakeEbayClient:
    def __init__(self, detail):
        self._detail = detail
        self.calls = []

    def get_item_condition_detail(self, item_id):
        self.calls.append(item_id)
        return self._detail


def make_match(condition_hint="not stated") -> MatchResult:
    item = WatchlistItem(
        id=1, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
        price_source=PriceSource.API, manual_market_price=None,
        discount_threshold=Decimal("0.25"), search_terms="gengar fossil", exclude_terms="",
        tier=Tier.STANDARD, active=True, last_polled_at=None,
    )
    listing = EbayListing(
        item_id="v1|307180972252|0", title="Gengar Fossil Holo 5/62", listing_type=ListingType.BUY_IT_NOW,
        item_price=Decimal("80.00"), shipping_price=Decimal("3.00"),
        item_web_url="https://www.ebay.co.uk/itm/307180972252", image_url=None,
    )
    return MatchResult(
        listing=listing, watchlist_item=item, market_price_gbp=Decimal("171.53"),
        max_bid_gbp=Decimal("128.65"), discount_pct=Decimal("51.61"), condition_hint=condition_hint,
    )


class TestEnrichConditionFromItemDetail:
    def test_upgrades_title_guess_with_structured_detail(self):
        match = make_match(condition_hint="not stated")
        ebay = FakeEbayClient(detail="Lightly played (Excellent) — Moderate surface scuffing")

        _enrich_condition_from_item_detail(ebay, match)

        assert match.condition_hint == "Lightly played (Excellent) — Moderate surface scuffing"
        assert ebay.calls == ["v1|307180972252|0"]

    def test_keeps_title_guess_when_detail_unavailable(self):
        match = make_match(condition_hint="near mint")
        ebay = FakeEbayClient(detail=None)

        _enrich_condition_from_item_detail(ebay, match)

        assert match.condition_hint == "near mint"  # untouched, not overwritten with nothing
