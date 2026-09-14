from datetime import datetime, timedelta, timezone
from decimal import Decimal

from kestrel.models import PriceSource, Tier, WatchlistItem
from kestrel.scheduler import ScheduleParams, select_rows_for_cycle

NOW = datetime(2026, 9, 14, 20, 0, 0, tzinfo=timezone.utc)


def make_item(id_, tier=Tier.STANDARD, last_polled_at=None, active=True) -> WatchlistItem:
    return WatchlistItem(
        id=id_,
        game="pokemon",
        card_name=f"Card {id_}",
        set_name=None,
        card_number=None,
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="x",
        exclude_terms="",
        tier=tier,
        active=active,
        last_polled_at=last_polled_at,
    )


class TestScheduleParams:
    def test_rows_per_cycle_respects_budget(self):
        # 5-minute interval -> 288 cycles/day. Budget 2880 -> 10 calls/cycle
        # -> 5 rows/cycle at 2 calls/row.
        params = ScheduleParams(poll_interval_seconds=300, daily_call_budget=2880)
        assert params.cycles_per_day == 288
        assert params.rows_per_cycle == 5

    def test_never_returns_zero_rows(self):
        params = ScheduleParams(poll_interval_seconds=300, daily_call_budget=1)
        assert params.rows_per_cycle >= 1


class TestSelectRowsForCycle:
    def test_never_polled_rows_come_first(self):
        items = [
            make_item(1, last_polled_at=NOW - timedelta(minutes=1)),
            make_item(2, last_polled_at=None),
        ]
        params = ScheduleParams(poll_interval_seconds=300, daily_call_budget=86400)  # rows_per_cycle huge but capped by len
        selected = select_rows_for_cycle(items, params, now=NOW)
        assert selected[0].id == 2

    def test_most_stale_row_selected_first_under_tight_budget(self):
        items = [
            make_item(1, last_polled_at=NOW - timedelta(minutes=5)),
            make_item(2, last_polled_at=NOW - timedelta(minutes=50)),
            make_item(3, last_polled_at=NOW - timedelta(minutes=15)),
        ]
        params = ScheduleParams(poll_interval_seconds=300, daily_call_budget=576)  # 288 cycles/day -> 2 calls/cycle -> 1 row/cycle
        selected = select_rows_for_cycle(items, params, now=NOW)
        assert len(selected) == 1
        assert selected[0].id == 2

    def test_hot_tier_breaks_ties_over_standard(self):
        items = [
            make_item(1, tier=Tier.STANDARD, last_polled_at=NOW - timedelta(minutes=10)),
            make_item(2, tier=Tier.HOT, last_polled_at=NOW - timedelta(minutes=10)),
        ]
        params = ScheduleParams(poll_interval_seconds=300, daily_call_budget=576)
        selected = select_rows_for_cycle(items, params, now=NOW)
        assert selected[0].id == 2  # hot wins the tie despite identical staleness

    def test_inactive_rows_never_selected(self):
        items = [
            make_item(1, active=False, last_polled_at=None),
            make_item(2, active=True, last_polled_at=NOW),
        ]
        params = ScheduleParams(poll_interval_seconds=300, daily_call_budget=86400)
        selected = select_rows_for_cycle(items, params, now=NOW)
        assert all(i.id != 1 for i in selected)
