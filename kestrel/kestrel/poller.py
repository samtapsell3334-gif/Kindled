"""
One poll cycle: pick the watchlist rows due for a check (scheduler.py),
fetch each row's market price, search eBay, evaluate matches, print any new
deal to the console/log, send a Telegram alert, and persist it to the
alerts log. Drift detection still isn't built.
"""

from __future__ import annotations

import logging
import sqlite3
from datetime import datetime, timezone

import requests

from decimal import Decimal

from kestrel import telegram_client
from kestrel.alerts import log_alert
from kestrel.config import Config
from kestrel.ebay_client import EbayApiError, EbayClient
from kestrel.grading import detect_grade, get_graded_price
from kestrel.matcher import discount_percentage, evaluate_listing, price_confidence_pct
from kestrel.models import MatchResult, PriceSource, WatchlistItem
from kestrel.pricing import PRICE_ANOMALY_RATIO, get_market_price_gbp
from kestrel.pricing.cache import get_last_price_any_age, normalize_cache_key
from kestrel.scheduler import ScheduleParams, select_rows_for_cycle
from kestrel.watchlist import list_items, mark_polled

logger = logging.getLogger("kestrel.poller")


def is_seen(conn: sqlite3.Connection, item_id: str) -> bool:
    row = conn.execute("SELECT 1 FROM seen_items WHERE item_id = ?", (item_id,)).fetchone()
    return row is not None


def mark_seen(conn: sqlite3.Connection, item_id: str, watchlist_id: int, listing_type: str) -> None:
    conn.execute(
        "INSERT OR IGNORE INTO seen_items (item_id, watchlist_id, listing_type, first_seen_at) VALUES (?, ?, ?, ?)",
        (item_id, watchlist_id, listing_type, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()


def print_match(match: MatchResult) -> None:
    listing = match.listing
    item = match.watchlist_item
    lines = [
        "=" * 60,
        f"DEAL: {item.card_name}" + (f" ({item.set_name})" if item.set_name else ""),
        f"  Game:            {item.game}",
        f"  Listing type:    {listing.listing_type.value}",
        f"  Listing price:   GBP {listing.total_price} (incl. postage GBP {listing.shipping_price})",
        f"  Market price:    GBP {match.market_price_gbp}",
        f"  Discount:        {match.discount_pct}% below market (gross, before fees)",
        f"  Max bid (cap):   GBP {match.max_bid_gbp}",
        f"  Condition:       {match.condition_hint} (eBay's seller-declared field when available, else a title guess — always check the listing)",
        f"  Est. net profit: GBP {match.estimated_net_profit_gbp} (after est. resale fee + postage — tune the estimate in .env)",
        f"  Net breakeven:   GBP {match.net_breakeven_cap_gbp} (most you could pay and still break even after resale costs)",
    ]
    if match.price_confidence_pct is not None:
        lines.append(
            f"  Price confidence: {match.price_confidence_pct}% (heuristic, not a guarantee — see README)"
        )
    if listing.accepts_best_offer:
        offer_line = (
            f"  Make Offer:      accepted — suggest offering GBP {match.suggested_offer_gbp}"
            if match.suggested_offer_gbp is not None
            else "  Make Offer:      accepted, but no offer below asking still clears a profitable margin"
        )
        lines.append(offer_line)
    if match.detected_grade is not None and match.graded_market_price_gbp is not None:
        lines.append(
            f"  Graded value:    {match.detected_grade.company} {match.detected_grade.grade} = "
            f"GBP {match.graded_market_price_gbp} (your entered price for this exact grade) "
            f"-> {match.graded_discount_pct}% below that, vs {match.discount_pct}% below raw/ungraded market"
        )
    if listing.item_end_date:
        remaining = listing.item_end_date - datetime.now(timezone.utc)
        minutes = max(int(remaining.total_seconds() // 60), 0)
        lines.append(f"  Ends in:         ~{minutes} min ({listing.item_end_date.isoformat()})")
        lines.append(f"  Current bid:     GBP {listing.current_bid_price} ({listing.bid_count} bids)")
    lines.append(f"  Listing:         {listing.item_web_url}")
    if listing.image_url:
        lines.append(f"  Image:           {listing.image_url}")
    lines.append("=" * 60)
    print("\n".join(lines))


def _enrich_condition_from_item_detail(ebay: EbayClient, result: MatchResult) -> None:
    """
    Upgrade result.condition_hint from a title-keyword guess to eBay's real,
    structured, seller-declared "Card Condition" field when it's available —
    one extra API call, spent only here, on a listing that already cleared
    price/title/printing. Never raises: get_item_condition_detail already
    catches its own failures and returns None, which just means the
    title-based guess (already set by matcher.evaluate_listing) stands.
    """
    detail = ebay.get_item_condition_detail(result.listing.item_id)
    if detail:
        result.condition_hint = detail


def _enrich_grade_from_manual_price(conn: sqlite3.Connection, result: MatchResult) -> None:
    """
    If the title or the (real, seller-declared) condition text names a
    grade this watchlist row has a manual price for, attach the real
    grade-vs-value comparison. No grade detected, or no price entered for
    that exact grade -> nothing changes, the listing still carries only its
    ungraded discount_pct as before. See kestrel/grading.py.
    """
    detected = detect_grade(result.listing.title) or detect_grade(result.condition_hint)
    if detected is None:
        return
    price = get_graded_price(conn, result.watchlist_item.id, detected.company, detected.grade)
    if price is None:
        return
    result.detected_grade = detected
    result.graded_market_price_gbp = price
    result.graded_discount_pct = discount_percentage(result.listing.total_price, price)


def _enrich_price_confidence(item: WatchlistItem, market_price: Decimal, previous_price: Decimal | None, result: MatchResult) -> None:
    """
    Score confidence in market_price_gbp using signals real enough to
    check, not a fabricated statistic (see matcher.price_confidence_pct for
    the full rationale). previous_price must come from *before*
    get_market_price_gbp's own cache write, or the "is this the first ever
    fetch" / "did this just swing anomalously" signals are lost — see the
    caller in _evaluate_watchlist_row.
    """
    if item.price_source == PriceSource.MANUAL:
        result.price_confidence_pct = price_confidence_pct(
            price_source=PriceSource.MANUAL, has_full_identity=True, is_first_fetch=False, is_anomalous=False
        )
        return

    is_anomalous = (
        previous_price is not None
        and previous_price > 0
        and market_price > 0
        and max(market_price / previous_price, previous_price / market_price) >= PRICE_ANOMALY_RATIO
    )
    result.price_confidence_pct = price_confidence_pct(
        price_source=item.price_source,
        has_full_identity=bool(item.set_name) and bool(item.card_number),
        is_first_fetch=previous_price is None,
        is_anomalous=is_anomalous,
    )


def _evaluate_watchlist_row(
    conn: sqlite3.Connection,
    session: requests.Session,
    config: Config,
    ebay: EbayClient,
    item: WatchlistItem,
) -> list[MatchResult]:
    previous_price: Decimal | None = None
    if item.price_source != PriceSource.MANUAL:
        # Must be read *before* get_market_price_gbp, which overwrites this
        # same cache entry with the fresh price as a side effect.
        cache_key = normalize_cache_key(item.game, item.set_name, item.card_number, item.card_name)
        previous_price = get_last_price_any_age(conn, cache_key)

    market_price = get_market_price_gbp(conn, session, config, item)
    if market_price is None:
        logger.warning("Skipping row %s (%s) — no market price available this cycle", item.id, item.card_name)
        return []

    matches: list[MatchResult] = []
    try:
        bin_listings = ebay.search_buy_it_now(item.search_terms)
        auction_listings = ebay.search_auctions(
            item.search_terms,
            window_minutes=config.auction_alert_window_minutes,
            max_bid_count=config.auction_max_bid_count,
        )
    except EbayApiError:
        logger.exception("eBay search failed for row %s (%s)", item.id, item.card_name)
        return []

    for listing in [*bin_listings, *auction_listings]:
        if is_seen(conn, listing.item_id):
            continue

        result = evaluate_listing(
            listing,
            item,
            market_price,
            auction_window_minutes=config.auction_alert_window_minutes,
            auction_max_bid_count=config.auction_max_bid_count,
            fee_rate=config.ebay_seller_fee_rate,
            resale_postage=config.resale_postage_gbp,
            offer_negotiation_margin=config.offer_negotiation_margin,
        )
        # Mark seen regardless of match, so a listing that doesn't clear the
        # cap today doesn't get re-evaluated (and potentially re-logged in
        # phase 3) every single cycle for its whole lifetime.
        mark_seen(conn, listing.item_id, item.id, listing.listing_type.value)
        if result is not None:
            _enrich_condition_from_item_detail(ebay, result)
            _enrich_grade_from_manual_price(conn, result)
            _enrich_price_confidence(item, market_price, previous_price, result)
            matches.append(result)

    mark_polled(conn, item.id)
    return matches


def run_poll_cycle(conn: sqlite3.Connection, config: Config, ebay: EbayClient, session: requests.Session) -> list[MatchResult]:
    all_items = list_items(conn, active_only=True)
    params = ScheduleParams(
        poll_interval_seconds=config.poll_interval_seconds,
        daily_call_budget=config.ebay_daily_call_budget,
    )
    due_items = select_rows_for_cycle(all_items, params)

    logger.info(
        "Poll cycle: %d/%d active rows due this cycle (budget allows %d rows/cycle)",
        len(due_items),
        len(all_items),
        params.rows_per_cycle,
    )

    telegram_enabled = telegram_client.is_configured(config)

    all_matches: list[MatchResult] = []
    for item in due_items:
        matches = _evaluate_watchlist_row(conn, session, config, ebay, item)
        for match in matches:
            print_match(match)
            log_alert(conn, match)
            if telegram_enabled:
                sent = telegram_client.send_alert(config, match, session)
                if not sent:
                    logger.warning("Telegram alert failed for item %s — see console output above instead", match.listing.item_id)
        all_matches.extend(matches)

    if not all_matches:
        logger.info("No new deals this cycle.")

    return all_matches
