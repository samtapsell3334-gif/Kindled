from datetime import datetime, timezone
from decimal import Decimal

import pytest

from kestrel.db import get_connection, init_db
from kestrel.grading import set_graded_price
from kestrel.models import DetectedGrade, EbayListing, ListingType, MatchResult, PriceSource, Tier, WatchlistItem
import kestrel.poller as poller_module
from kestrel.poller import (
    _enrich_condition_from_item_detail,
    _enrich_grade_from_manual_price,
    _enrich_price_confidence,
    _evaluate_watchlist_row,
)
from kestrel.watchlist import add_item, get_item

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


class FakeSearchEbayClient:
    """Fake covering everything _evaluate_watchlist_row calls on its ebay
    client: two searches plus the per-match condition-detail and
    description lookups."""

    def __init__(self, bin_listings, condition_detail=None, description=None):
        self._bin_listings = bin_listings
        self._condition_detail = condition_detail
        self._description = description

    def search_buy_it_now(self, search_terms):
        return self._bin_listings

    def search_auctions(self, search_terms, *, window_minutes, max_bid_count):
        return []

    def get_item_condition_detail(self, item_id):
        return self._condition_detail

    def get_item_description(self, item_id):
        return self._description


def _make_listing(item_id, title, condition_detail_hint=None):
    return EbayListing(
        item_id=item_id, title=title, listing_type=ListingType.BUY_IT_NOW,
        item_price=Decimal("10.00"), shipping_price=Decimal("1.00"),
        item_web_url=f"https://www.ebay.co.uk/itm/{item_id}", image_url=None,
    )


class TestConditionGateInEvaluateWatchlistRow:
    """Integration coverage for the real finding that triggered
    is_condition_acceptable: a played-condition listing must never become a
    match, even though it clears every other check (price, title, printing).
    """

    def test_heavily_played_listing_never_becomes_a_match(self, conn, monkeypatch):
        watchlist_id = add_item(
            conn, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD,
        )
        item = get_item(conn, watchlist_id)
        monkeypatch.setattr(poller_module, "get_market_price_gbp", lambda *a, **kw: Decimal("171.53"))
        listing = _make_listing("v1|1|0", "Gengar Fossil Holo 5/62")
        ebay = FakeSearchEbayClient([listing], condition_detail="Heavily played (Poor) — Major creasing")
        from kestrel.config import Config

        matches = _evaluate_watchlist_row(conn, session=None, config=Config(), ebay=ebay, item=item)
        assert matches == []

    def test_near_mint_listing_still_becomes_a_match(self, conn, monkeypatch):
        watchlist_id = add_item(
            conn, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD,
        )
        item = get_item(conn, watchlist_id)
        monkeypatch.setattr(poller_module, "get_market_price_gbp", lambda *a, **kw: Decimal("171.53"))
        listing = _make_listing("v1|2|0", "Gengar Fossil Holo 5/62")
        ebay = FakeSearchEbayClient([listing], condition_detail="Near mint or better — Minor corner and edge wear")
        from kestrel.config import Config

        matches = _evaluate_watchlist_row(conn, session=None, config=Config(), ebay=ebay, item=item)
        assert len(matches) == 1
        assert matches[0].condition_hint.startswith("Near mint or better")


class TestDescriptionGuardInEvaluateWatchlistRow:
    """Integration coverage for the real finding that triggered
    description_is_guarded: a seller listing correct set/number, clean
    "Near mint or better" condition, and a title with no guard terms --
    but a shortDescription reading "As this is a handmade card...", i.e. a
    custom/fan print, not a real one. Must never become a match.
    """

    def test_handmade_disclaimer_in_description_blocks_the_match(self, conn, monkeypatch):
        watchlist_id = add_item(
            conn, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD,
        )
        item = get_item(conn, watchlist_id)
        monkeypatch.setattr(poller_module, "get_market_price_gbp", lambda *a, **kw: Decimal("171.53"))
        listing = _make_listing("v1|3|0", "Gengar Fossil Holo 5/62")
        ebay = FakeSearchEbayClient(
            [listing],
            condition_detail="Near mint or better — Minor corner and edge wear",
            description="As this is a handmade card, it may contain imperfections in cutting and centering.",
        )
        from kestrel.config import Config

        matches = _evaluate_watchlist_row(conn, session=None, config=Config(), ebay=ebay, item=item)
        assert matches == []

    def test_clean_description_still_becomes_a_match(self, conn, monkeypatch):
        watchlist_id = add_item(
            conn, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD,
        )
        item = get_item(conn, watchlist_id)
        monkeypatch.setattr(poller_module, "get_market_price_gbp", lambda *a, **kw: Decimal("171.53"))
        listing = _make_listing("v1|4|0", "Gengar Fossil Holo 5/62")
        ebay = FakeSearchEbayClient(
            [listing],
            condition_detail="Near mint or better — Minor corner and edge wear",
            description="Genuine card from my personal collection, ships same day.",
        )
        from kestrel.config import Config

        matches = _evaluate_watchlist_row(conn, session=None, config=Config(), ebay=ebay, item=item)
        assert len(matches) == 1
