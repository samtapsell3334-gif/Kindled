from decimal import Decimal

import pytest

from kestrel.alerts import log_alert
from kestrel.db import get_connection, init_db
from kestrel.models import (
    EbayListing,
    ListingType,
    MatchResult,
    PriceSource,
    PurchaseStatus,
    Tier,
    WatchlistItem,
)
from kestrel.purchases import (
    add_purchase,
    add_purchase_from_alert,
    get_purchase,
    list_purchases,
    mark_listed,
    mark_sold,
    refresh_market_rate,
)
from kestrel.watchlist import add_item

from kestrel.config import Config
from kestrel.models import Purchase, PurchaseStatus as _PurchaseStatus


class _FakeResponse:
    def __init__(self, status_code, json_body=None):
        self.status_code = status_code
        self._json = json_body or {}

    def json(self):
        return self._json


class _FakeSession:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    def get(self, *args, **kwargs):
        self.calls += 1
        return self._responses.pop(0)


def _make_purchase(game="pokemon") -> Purchase:
    return Purchase(
        id=1, alert_id=None, card_name="Machamp", game=game, set_name="Base", card_number="8/102",
        bought_price_gbp=Decimal("3.95"), bought_at=None, status=_PurchaseStatus.TO_LIST,
        listed_price_gbp=None, sold_price_gbp=None, notes=None,
    )


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


@pytest.fixture()
def alert_id(conn, watchlist_id) -> int:
    item = WatchlistItem(
        id=watchlist_id, game="pokemon", card_name="Gengar", set_name="Fossil", card_number="5/62",
        price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
        search_terms="gengar fossil", exclude_terms="", tier=Tier.STANDARD, active=True, last_polled_at=None,
    )
    listing = EbayListing(
        item_id="v1|1|0", title="Gengar Fossil Holo 5/62", listing_type=ListingType.BUY_IT_NOW,
        item_price=Decimal("80.00"), shipping_price=Decimal("3.00"),
        item_web_url="https://www.ebay.co.uk/itm/1", image_url="https://img/1.jpg",
    )
    match = MatchResult(
        listing=listing, watchlist_item=item, market_price_gbp=Decimal("171.53"),
        max_bid_gbp=Decimal("128.65"), discount_pct=Decimal("51.61"), condition_hint="near mint",
    )
    return log_alert(conn, match)


class TestAddPurchase:
    def test_manual_purchase_has_no_alert_id(self, conn):
        purchase_id = add_purchase(
            conn, card_name="Charizard", game="pokemon", set_name="Base", card_number="4/102",
            bought_price_gbp=Decimal("125.00"),
        )
        record = get_purchase(conn, purchase_id)
        assert record.alert_id is None
        assert record.card_name == "Charizard"
        assert record.bought_price_gbp == Decimal("125.00")
        assert record.status == PurchaseStatus.TO_LIST
        assert record.listed_price_gbp is None
        assert record.sold_price_gbp is None

    def test_get_nonexistent_purchase_returns_none(self, conn):
        assert get_purchase(conn, 9999) is None


class TestAddPurchaseFromAlert:
    def test_pulls_card_identity_from_the_alerts_watchlist_row(self, conn, alert_id):
        purchase_id = add_purchase_from_alert(conn, alert_id, Decimal("3.95"), notes="from the flood batch")
        record = get_purchase(conn, purchase_id)
        assert record.alert_id == alert_id
        assert record.card_name == "Gengar"
        assert record.set_name == "Fossil"
        assert record.card_number == "5/62"
        assert record.bought_price_gbp == Decimal("3.95")
        assert record.notes == "from the flood batch"

    def test_raises_for_nonexistent_alert(self, conn):
        with pytest.raises(ValueError):
            add_purchase_from_alert(conn, 9999, Decimal("3.95"))


class TestListPurchases:
    def test_lists_oldest_first(self, conn):
        first = add_purchase(conn, card_name="A", game="pokemon", set_name=None, card_number=None, bought_price_gbp=Decimal("1"))
        second = add_purchase(conn, card_name="B", game="pokemon", set_name=None, card_number=None, bought_price_gbp=Decimal("2"))
        rows = list_purchases(conn)
        assert [r.id for r in rows] == [first, second]

    def test_filters_by_status(self, conn):
        to_list = add_purchase(conn, card_name="A", game="pokemon", set_name=None, card_number=None, bought_price_gbp=Decimal("1"))
        listed = add_purchase(conn, card_name="B", game="pokemon", set_name=None, card_number=None, bought_price_gbp=Decimal("2"))
        mark_listed(conn, listed, Decimal("5.00"))

        assert [r.id for r in list_purchases(conn, status=PurchaseStatus.TO_LIST)] == [to_list]
        assert [r.id for r in list_purchases(conn, status=PurchaseStatus.LISTED)] == [listed]


class TestMarkListedAndSold:
    def test_mark_listed_updates_status_and_price(self, conn):
        purchase_id = add_purchase(conn, card_name="A", game="pokemon", set_name=None, card_number=None, bought_price_gbp=Decimal("1"))
        mark_listed(conn, purchase_id, Decimal("15.00"))
        record = get_purchase(conn, purchase_id)
        assert record.status == PurchaseStatus.LISTED
        assert record.listed_price_gbp == Decimal("15.00")

    def test_mark_sold_updates_status_and_price(self, conn):
        purchase_id = add_purchase(conn, card_name="A", game="pokemon", set_name=None, card_number=None, bought_price_gbp=Decimal("1"))
        mark_listed(conn, purchase_id, Decimal("15.00"))
        mark_sold(conn, purchase_id, Decimal("14.00"))
        record = get_purchase(conn, purchase_id)
        assert record.status == PurchaseStatus.SOLD
        assert record.sold_price_gbp == Decimal("14.00")
        assert record.listed_price_gbp == Decimal("15.00")  # not clobbered


class TestRefreshMarketRate:
    """The retry-through-transient-failure behavior itself is tested at the
    source (pricing/pokemon.py, pricing/yugioh.py) -- refresh_market_rate
    is deliberately just a thin dispatch by game, with no second retry
    layer of its own (that would just stack delays for no benefit, see its
    docstring)."""

    def test_returns_rate_for_pokemon(self, monkeypatch):
        monkeypatch.setattr("kestrel.pricing.pokemon.time.sleep", lambda *_: None)
        body = {"data": [{"cardmarket": {"prices": {"trendPrice": 100.0}}}]}
        session = _FakeSession([_FakeResponse(200, body)])
        rate = refresh_market_rate(session, Config(fx_eur_to_gbp=Decimal("0.85")), _make_purchase())
        assert rate == Decimal("85.00")
        assert session.calls == 1

    def test_unsupported_game_returns_none_without_any_call(self):
        session = _FakeSession([])
        rate = refresh_market_rate(session, Config(), _make_purchase(game="football"))
        assert rate is None
        assert session.calls == 0
