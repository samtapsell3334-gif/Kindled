"""
run_poll_cycle_concurrent's own orchestration logic (parallel execution,
result aggregation, alert logging, one worker's failure not crashing the
whole cycle) — isolated from the full network-dependent row evaluation
(_evaluate_watchlist_row itself is covered by test_poller.py) by
monkeypatching _evaluate_watchlist_row_standalone directly. Real concurrent
DB writes (WAL mode + busy_timeout, see db.connect) still exercised for
real, since each fake worker still calls the real log_alert against a real
connection to the same file.
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from kestrel.alerts import list_unreviewed
from kestrel.config import Config
from kestrel.db import get_connection, init_db
from kestrel.models import EbayListing, ListingType, MatchResult, PriceSource, Tier, WatchlistItem
from kestrel.watchlist import add_item

import kestrel.poller as poller_module
from kestrel.poller import run_poll_cycle_concurrent


@pytest.fixture()
def db_path(tmp_path):
    path = tmp_path / "test.db"
    init_db(path)
    return path


def _add_row(db_path, card_name: str) -> int:
    with get_connection(db_path) as conn:
        return add_item(
            conn, game="pokemon", card_name=card_name, set_name="Base", card_number="1/102",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms=card_name.lower(), exclude_terms="", tier=Tier.STANDARD,
        )


def _make_match(watchlist_id: int, card_name: str) -> MatchResult:
    item = WatchlistItem(
        id=watchlist_id, game="pokemon", card_name=card_name, set_name="Base", card_number="1/102",
        price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
        search_terms=card_name.lower(), exclude_terms="", tier=Tier.STANDARD, active=True, last_polled_at=None,
    )
    listing = EbayListing(
        item_id=f"v1|{watchlist_id}|0", title=f"{card_name} Base 1/102", listing_type=ListingType.BUY_IT_NOW,
        item_price=Decimal("10.00"), shipping_price=Decimal("1.00"),
        item_web_url="https://ebay.co.uk/itm/x", image_url=None,
    )
    return MatchResult(
        listing=listing, watchlist_item=item, market_price_gbp=Decimal("50.00"),
        max_bid_gbp=Decimal("37.50"), discount_pct=Decimal("78.00"),
    )


class TestRunPollCycleConcurrent:
    def test_aggregates_matches_from_all_workers(self, db_path, monkeypatch):
        id_a = _add_row(db_path, "Alakazam")
        id_b = _add_row(db_path, "Blastoise")

        def fake_evaluate(config, item):
            return [_make_match(item.id, item.card_name)]

        monkeypatch.setattr(poller_module, "_evaluate_watchlist_row_standalone", fake_evaluate)

        config = Config(db_path=db_path)
        matches = run_poll_cycle_concurrent(config, max_workers=4)

        assert {m.watchlist_item.card_name for m in matches} == {"Alakazam", "Blastoise"}

    def test_matches_are_logged_as_alerts(self, db_path, monkeypatch):
        _add_row(db_path, "Charizard")

        def fake_evaluate(config, item):
            return [_make_match(item.id, item.card_name)]

        monkeypatch.setattr(poller_module, "_evaluate_watchlist_row_standalone", fake_evaluate)

        config = Config(db_path=db_path)
        run_poll_cycle_concurrent(config, max_workers=4)

        with get_connection(db_path) as conn:
            alerts = list_unreviewed(conn)
        assert len(alerts) == 1
        assert alerts[0].card_name == "Charizard"

    def test_one_worker_failing_does_not_lose_the_others(self, db_path, monkeypatch):
        id_ok = _add_row(db_path, "Gengar")
        _add_row(db_path, "Haunter")  # this one will raise

        def fake_evaluate(config, item):
            if item.card_name == "Haunter":
                raise RuntimeError("simulated network failure")
            return [_make_match(item.id, item.card_name)]

        monkeypatch.setattr(poller_module, "_evaluate_watchlist_row_standalone", fake_evaluate)

        config = Config(db_path=db_path)
        matches = run_poll_cycle_concurrent(config, max_workers=4)

        assert [m.watchlist_item.card_name for m in matches] == ["Gengar"]

    def test_no_matches_returns_empty_list_without_error(self, db_path, monkeypatch):
        _add_row(db_path, "Pikachu")
        monkeypatch.setattr(poller_module, "_evaluate_watchlist_row_standalone", lambda config, item: [])

        config = Config(db_path=db_path)
        matches = run_poll_cycle_concurrent(config, max_workers=4)

        assert matches == []
