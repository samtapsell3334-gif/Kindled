from decimal import Decimal

import pytest
import requests

from kestrel.config import Config
from kestrel.db import get_connection, init_db
from kestrel.models import PriceSource, Tier, WatchlistItem
from kestrel.pricing import get_market_price_gbp
from kestrel.pricing.cache import get_cached_price, normalize_cache_key


@pytest.fixture()
def conn(tmp_path):
    db_path = tmp_path / "test.db"
    init_db(db_path)
    with get_connection(db_path) as c:
        yield c


def make_item(**overrides) -> WatchlistItem:
    defaults = dict(
        id=1,
        game="pokemon",
        card_name="Charizard",
        set_name="Base",
        card_number="4",
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="charizard",
        exclude_terms="",
        tier=Tier.STANDARD,
        active=True,
        last_polled_at=None,
    )
    defaults.update(overrides)
    return WatchlistItem(**defaults)


class RaisingSession:
    """Simulates a network hiccup (timeout, DNS failure, connection reset)."""

    def get(self, *args, **kwargs):
        raise requests.exceptions.ReadTimeout("simulated read timeout")


class TestManualPassthrough:
    def test_manual_row_never_touches_network(self, conn):
        item = make_item(price_source=PriceSource.MANUAL, manual_market_price=Decimal("12.50"), game="football")
        price = get_market_price_gbp(conn, RaisingSession(), Config(), item)
        assert price == Decimal("12.50")


class TestUnsupportedGame:
    def test_api_row_with_unknown_game_returns_none_not_exception(self, conn):
        item = make_item(game="magic")  # not pokemon or yugioh
        price = get_market_price_gbp(conn, RaisingSession(), Config(), item)
        assert price is None


class TestNetworkFailureIsNonFatal:
    def test_request_exception_returns_none_instead_of_raising(self, conn):
        item = make_item(game="pokemon")
        # Must not raise -- a poll cycle should survive one row's network hiccup.
        price = get_market_price_gbp(conn, RaisingSession(), Config(), item)
        assert price is None

    def test_network_failure_does_not_poison_the_cache(self, conn):
        item = make_item(game="pokemon")
        get_market_price_gbp(conn, RaisingSession(), Config(), item)
        cache_key = normalize_cache_key("pokemon", item.set_name, item.card_number, item.card_name)
        assert get_cached_price(conn, cache_key, cache_hours=12) is None
