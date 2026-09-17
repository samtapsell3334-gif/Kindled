from datetime import datetime, timezone
from decimal import Decimal

import pytest

from kestrel.db import get_connection, init_db
from kestrel.grading import set_graded_price
from kestrel.models import DetectedGrade, EbayListing, ListingType, MatchResult, PriceSource, Tier, WatchlistItem
from kestrel.poller import _enrich_condition_from_item_detail, _enrich_grade_from_manual_price, _enrich_price_confidence
from kestrel.watchlist import add_item

NOW = datetime(2026, 9, 14, 20, 0, 0, tzinfo=timezone.utc)


@pytest.fixture()
def conn(tmp_path):
    db_path = tmp_path / "test.db"
    init_db(db_path)
    with get_connection(db_path) as c:
        yield c


class FakeEbayClient:
    def __init__(self, detail):
        self._detail = detail
        self.calls = []

    def get_item_condition_detail(self, item_id):
        self.calls.append(item_id)
        return self._detail


def make_match(condition_hint="not stated", watchlist_id=1, title="Gengar Fossil Holo 5/62") -> MatchResult:
    item = WatchlistItem(
        id=watchlist_id, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
        price_source=PriceSource.API, manual_market_price=None,
        discount_threshold=Decimal("0.25"), search_terms="gengar fossil", exclude_terms="",
        tier=Tier.STANDARD, active=True, last_polled_at=None,
    )
    listing = EbayListing(
        item_id="v1|307180972252|0", title=title, listing_type=ListingType.BUY_IT_NOW,
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


def make_watchlist_item(**overrides) -> WatchlistItem:
    defaults = dict(
        id=1, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
        price_source=PriceSource.API, manual_market_price=None,
        discount_threshold=Decimal("0.25"), search_terms="gengar fossil", exclude_terms="",
        tier=Tier.STANDARD, active=True, last_polled_at=None,
    )
    defaults.update(overrides)
    return WatchlistItem(**defaults)


class TestEnrichPriceConfidence:
    def test_manual_price_source_scores_90_regardless_of_signals(self):
        item = make_watchlist_item(price_source=PriceSource.MANUAL, set_name=None, card_number=None)
        match = make_match()
        _enrich_price_confidence(item, Decimal("50.00"), previous_price=None, result=match)
        assert match.price_confidence_pct == Decimal("90")

    def test_api_full_identity_repeat_fetch_scores_75(self):
        item = make_watchlist_item(set_name="Fossil", card_number="5/62")
        match = make_match()
        _enrich_price_confidence(item, Decimal("50.00"), previous_price=Decimal("48.00"), result=match)
        assert match.price_confidence_pct == Decimal("75")

    def test_api_first_ever_fetch_scores_60(self):
        item = make_watchlist_item(set_name="Fossil", card_number="5/62")
        match = make_match()
        _enrich_price_confidence(item, Decimal("50.00"), previous_price=None, result=match)
        assert match.price_confidence_pct == Decimal("60")

    def test_api_missing_set_or_number_scores_40(self):
        item = make_watchlist_item(set_name=None, card_number=None)
        match = make_match()
        _enrich_price_confidence(item, Decimal("50.00"), previous_price=Decimal("48.00"), result=match)
        assert match.price_confidence_pct == Decimal("40")

    def test_anomalous_swing_vs_previous_price_scores_25(self):
        item = make_watchlist_item(set_name="Fossil", card_number="5/62")
        match = make_match()
        # 18x swing, same shape as the real anomaly this guards against
        _enrich_price_confidence(item, Decimal("900.00"), previous_price=Decimal("50.00"), result=match)
        assert match.price_confidence_pct == Decimal("25")


class TestEnrichGradeFromManualPrice:
    def test_attaches_comparison_when_grade_detected_and_priced(self, conn):
        watchlist_id = add_item(
            conn, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD,
        )
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("120.00"))
        match = make_match(watchlist_id=watchlist_id, title="Gengar Fossil PSA 9 Holo 5/62")

        _enrich_grade_from_manual_price(conn, match)

        assert match.detected_grade.company == "PSA"
        assert match.detected_grade.grade == Decimal("9")
        assert match.graded_market_price_gbp == Decimal("120.00")
        # listing total_price is 80.00 + 3.00 postage = 83.00
        assert match.graded_discount_pct == Decimal("30.83")

    def test_grade_detected_but_no_price_entered_still_surfaces_the_grade(self, conn):
        # detected_grade is set even without a price, so the alert visibly
        # flags "this is graded" rather than silently looking like a normal
        # raw-priced deal -- only the price/discount fields stay empty.
        watchlist_id = add_item(
            conn, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD,
        )
        match = make_match(watchlist_id=watchlist_id, title="Gengar Fossil PSA 9 Holo 5/62")

        _enrich_grade_from_manual_price(conn, match)

        assert match.detected_grade == DetectedGrade(company="PSA", grade=Decimal("9"))
        assert match.graded_market_price_gbp is None
        assert match.graded_discount_pct is None

    def test_no_grade_mentioned_leaves_result_untouched(self, conn):
        watchlist_id = add_item(
            conn, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD,
        )
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("120.00"))
        match = make_match(watchlist_id=watchlist_id, title="Gengar Fossil Holo 5/62 near mint")

        _enrich_grade_from_manual_price(conn, match)

        assert match.detected_grade is None

    def test_falls_back_to_condition_hint_when_title_has_no_grade(self, conn):
        # Real case this covers: eBay's structured condition field (fetched
        # separately, see _enrich_condition_from_item_detail) sometimes
        # names the grade even when the seller's title doesn't.
        watchlist_id = add_item(
            conn, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD,
        )
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("120.00"))
        match = make_match(
            watchlist_id=watchlist_id, title="Gengar Fossil Holo 5/62", condition_hint="Graded PSA 9 — Mint"
        )

        _enrich_grade_from_manual_price(conn, match)

        assert match.detected_grade.company == "PSA"
        assert match.graded_market_price_gbp == Decimal("120.00")
