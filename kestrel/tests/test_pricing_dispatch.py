from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
import requests

from kestrel.config import Config
from kestrel.db import get_connection, init_db
from kestrel.models import PriceSource, Tier, WatchlistItem
from kestrel.pricing import get_market_price_gbp
from kestrel.pricing.cache import get_cached_price, normalize_cache_key


def _seed_expired_cache_entry(conn, cache_key: str, price: Decimal) -> None:
    """Insert a cache row old enough that get_cached_price ignores it (so a
    fresh fetch happens) while get_last_price_any_age still sees it."""
    stale = (datetime.now(timezone.utc) - timedelta(hours=13)).isoformat()
    conn.execute(
        "INSERT INTO price_cache (cache_key, game, market_price_gbp, source, fetched_at) VALUES (?, ?, ?, ?, ?)",
        (cache_key, "pokemon", str(price), "pokemontcg.io", stale),
    )
    conn.commit()


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


class _FixedResponse:
    def __init__(self, trend_price_eur):
        self.status_code = 200
        self._trend = trend_price_eur

    def json(self):
        return {"data": [{"cardmarket": {"prices": {"trendPrice": self._trend}}}]}


class FixedPriceSession:
    """Returns a pokemontcg.io-shaped 200 response with a fixed EUR trend price."""

    def __init__(self, trend_price_eur):
        self._trend = trend_price_eur

    def get(self, *args, **kwargs):
        return _FixedResponse(self._trend)


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


class TestPriceAnomalyDetection:
    """Regression coverage for a real finding: the same pokemontcg.io card ID
    returned an 18x different trendPrice between a targeted query and a
    bulk-paginated one, days apart. Not hypothetical."""

    def test_wildly_different_price_is_logged_but_still_returned(self, conn, caplog):
        item = make_item(game="pokemon")
        cache_key = normalize_cache_key("pokemon", item.set_name, item.card_number, item.card_name)
        _seed_expired_cache_entry(conn, cache_key, Decimal("197.30"))

        # A fresh fetch comes back ~18x higher, e.g. the real base1-4 anomaly.
        with caplog.at_level("WARNING", logger="kestrel.pricing"):
            price = get_market_price_gbp(conn, FixedPriceSession(4184.60), Config(), item)

        # Not blocked -- there's no sold-comp data to know which fetch was
        # "right", so the new price is still used...
        assert price is not None
        assert price > Decimal("3000")
        # ...but it must be loud about it.
        assert any("ANOMALOUS PRICE" in r.message for r in caplog.records)

    def test_similar_price_does_not_warn(self, conn, caplog):
        item = make_item(game="pokemon")
        cache_key = normalize_cache_key("pokemon", item.set_name, item.card_number, item.card_name)
        _seed_expired_cache_entry(conn, cache_key, Decimal("197.30"))

        with caplog.at_level("WARNING", logger="kestrel.pricing"):
            get_market_price_gbp(conn, FixedPriceSession(235.0), Config(), item)  # ~2% higher in EUR terms

        assert not any("ANOMALOUS PRICE" in r.message for r in caplog.records)

    def test_first_ever_fetch_for_a_card_never_warns(self, conn, caplog):
        item = make_item(game="pokemon")  # nothing cached yet for this key
        with caplog.at_level("WARNING", logger="kestrel.pricing"):
            get_market_price_gbp(conn, FixedPriceSession(4184.60), Config(), item)
        assert not any("ANOMALOUS PRICE" in r.message for r in caplog.records)
