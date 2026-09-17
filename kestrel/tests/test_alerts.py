from decimal import Decimal

import pytest

from kestrel.alerts import get_alert, list_best, list_unreviewed, log_alert, mark_reviewed
from kestrel.db import get_connection, init_db
from kestrel.models import (
    EbayListing,
    ListingType,
    MatchResult,
    PriceSource,
    ReviewVerdict,
    Tier,
    WatchlistItem,
)
from kestrel.watchlist import add_item


@pytest.fixture()
def conn(tmp_path):
    db_path = tmp_path / "test.db"
    init_db(db_path)
    with get_connection(db_path) as c:
        yield c


@pytest.fixture()
def watchlist_id(conn) -> int:
    return add_item(
        conn,
        game="pokemon",
        card_name="Gengar",
        set_name="Fossil",
        card_number="5/62",
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.25"),
        search_terms="gengar fossil",
        exclude_terms="",
        tier=Tier.STANDARD,
    )


def make_match(watchlist_id: int, item_id="v1|1|0", net_profit="12.34") -> MatchResult:
    item = WatchlistItem(
        id=watchlist_id, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
        price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
        search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD, active=True, last_polled_at=None,
    )
    listing = EbayListing(
        item_id=item_id, title="Gengar Fossil Holo 5/62", listing_type=ListingType.BUY_IT_NOW,
        item_price=Decimal("80.00"), shipping_price=Decimal("3.00"),
        item_web_url="https://www.ebay.co.uk/itm/1", image_url="https://img/1.jpg",
    )
    return MatchResult(
        listing=listing, watchlist_item=item, market_price_gbp=Decimal("171.53"),
        max_bid_gbp=Decimal("128.65"), discount_pct=Decimal("51.61"), condition_hint="near mint",
        estimated_net_profit_gbp=Decimal(net_profit), net_breakeven_cap_gbp=Decimal("146.23"),
    )


class TestLogAlert:
    def test_persists_all_fields(self, conn, watchlist_id):
        alert_id = log_alert(conn, make_match(watchlist_id))
        record = get_alert(conn, alert_id)

        assert record.card_name == "Gengar"
        assert record.total_price_gbp == Decimal("83.00")  # 80 + 3 postage
        assert record.market_price_gbp == Decimal("171.53")
        assert record.condition_hint == "near mint"
        assert record.estimated_net_profit_gbp == Decimal("12.34")
        assert record.reviewed_at is None
        assert record.review_verdict is None

    def test_get_nonexistent_alert_returns_none(self, conn):
        assert get_alert(conn, 9999) is None


class TestListUnreviewed:
    def test_freshly_logged_alert_is_unreviewed(self, conn, watchlist_id):
        log_alert(conn, make_match(watchlist_id))
        assert len(list_unreviewed(conn)) == 1

    def test_reviewed_alert_drops_out_of_unreviewed(self, conn, watchlist_id):
        alert_id = log_alert(conn, make_match(watchlist_id))
        mark_reviewed(conn, alert_id, ReviewVerdict.LOOKS_GOOD)
        assert list_unreviewed(conn) == []

    def test_ordered_oldest_first(self, conn, watchlist_id):
        first = log_alert(conn, make_match(watchlist_id, item_id="v1|1|0"))
        second = log_alert(conn, make_match(watchlist_id, item_id="v1|2|0"))
        rows = list_unreviewed(conn)
        assert [r.id for r in rows] == [first, second]


class TestMarkReviewed:
    def test_records_verdict_and_notes(self, conn, watchlist_id):
        alert_id = log_alert(conn, make_match(watchlist_id))
        mark_reviewed(conn, alert_id, ReviewVerdict.FLAGGED, notes="photo shows wrong HP stat")

        record = get_alert(conn, alert_id)
        assert record.review_verdict == ReviewVerdict.FLAGGED
        assert record.review_notes == "photo shows wrong HP stat"
        assert record.reviewed_at is not None


class TestListBest:
    def test_ranked_by_net_profit_descending(self, conn, watchlist_id):
        low = log_alert(conn, make_match(watchlist_id, item_id="v1|low|0", net_profit="5.00"))
        high = log_alert(conn, make_match(watchlist_id, item_id="v1|high|0", net_profit="50.00"))
        mark_reviewed(conn, low, ReviewVerdict.LOOKS_GOOD)
        mark_reviewed(conn, high, ReviewVerdict.LOOKS_GOOD)

        rows = list_best(conn)
        assert [r.id for r in rows] == [high, low]

    def test_rejected_alerts_excluded(self, conn, watchlist_id):
        alert_id = log_alert(conn, make_match(watchlist_id, net_profit="999.00"))
        mark_reviewed(conn, alert_id, ReviewVerdict.REJECTED, notes="fake listing")

        assert list_best(conn) == []

    def test_flagged_alerts_still_included(self, conn, watchlist_id):
        alert_id = log_alert(conn, make_match(watchlist_id))
        mark_reviewed(conn, alert_id, ReviewVerdict.FLAGGED, notes="condition worse than stated")

        rows = list_best(conn)
        assert len(rows) == 1
        assert rows[0].review_verdict == ReviewVerdict.FLAGGED

    def test_unreviewed_alerts_excluded_from_best(self, conn, watchlist_id):
        log_alert(conn, make_match(watchlist_id, net_profit="999.00"))
        assert list_best(conn) == []

    def test_respects_limit(self, conn, watchlist_id):
        for i in range(5):
            alert_id = log_alert(conn, make_match(watchlist_id, item_id=f"v1|{i}|0"))
            mark_reviewed(conn, alert_id, ReviewVerdict.LOOKS_GOOD)

        assert len(list_best(conn, limit=2)) == 2
