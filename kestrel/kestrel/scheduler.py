"""
Call-budgeting for the eBay Browse API.

With a 40+ row watchlist, a flat "poll every row every 5 minutes" doesn't
fit inside eBay's application-tier daily call budget: each row needs two
search calls (Buy It Now + Auction — see ebay_client for why they're
separate), so N rows every cycle costs `N * 2 * cycles_per_day` calls/day.
At a 5-minute interval that's 288 cycles/day, so anything over ~7-8 rows
already blows a 4500/day budget if checked every single cycle.

Instead of shortening coverage uniformly, each poll cycle checks the rows
that are most "overdue" (longest since last polled), with `hot` rows
weighted ahead of `standard` ones so cards you care about more get checked
more often within the same budget. A full pass over the whole watchlist
then takes a few cycles instead of one, but every row is still guaranteed
to be checked at a bounded worst-case interval.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from kestrel.models import Tier, WatchlistItem

CALLS_PER_ROW_PER_CHECK = 2  # one Buy It Now search + one Auction search

# How much more often a 'hot' row is favored over a 'standard' row when both
# are equally overdue. Not a hard multiplier on frequency — just a
# tie-breaking weight used to sort the queue.
TIER_WEIGHT = {
    Tier.HOT: 2.0,
    Tier.STANDARD: 1.0,
}


@dataclass(frozen=True)
class ScheduleParams:
    poll_interval_seconds: int
    daily_call_budget: int
    calls_per_row_per_check: int = CALLS_PER_ROW_PER_CHECK

    @property
    def cycles_per_day(self) -> float:
        return 86400 / self.poll_interval_seconds

    @property
    def budget_per_cycle(self) -> float:
        return self.daily_call_budget / self.cycles_per_day

    @property
    def rows_per_cycle(self) -> int:
        """How many watchlist rows can be checked in a single cycle without
        exceeding the daily budget. Always at least 1 if there's any budget,
        so a tiny budget degrades to slow-but-working rather than nothing."""
        raw = int(self.budget_per_cycle // self.calls_per_row_per_check)
        return max(raw, 1)


def _staleness_seconds(item: WatchlistItem, now: datetime) -> float:
    if item.last_polled_at is None:
        # Never polled -> maximally overdue.
        return float("inf")
    delta = now - item.last_polled_at
    return delta.total_seconds()


def select_rows_for_cycle(
    items: list[WatchlistItem],
    params: ScheduleParams,
    now: datetime | None = None,
) -> list[WatchlistItem]:
    """
    Pick which active watchlist rows to poll this cycle.

    Ordering key: (staleness_seconds * tier_weight) descending — i.e. a row
    that's been waiting twice as long, or is weighted twice as important,
    rises to the front equally. Never-polled rows always come first.
    """
    now = now or datetime.now(timezone.utc)
    active = [i for i in items if i.active]

    def sort_key(item: WatchlistItem) -> float:
        staleness = _staleness_seconds(item, now)
        if staleness == float("inf"):
            return float("inf")
        return staleness * TIER_WEIGHT.get(item.tier, 1.0)

    ordered = sorted(active, key=sort_key, reverse=True)
    return ordered[: params.rows_per_cycle]
