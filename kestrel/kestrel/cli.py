"""
Command-line entry point.

    python -m kestrel init-db
    python -m kestrel watchlist add ...
    python -m kestrel watchlist list
    python -m kestrel watchlist enable|disable|remove <id>
    python -m kestrel watchlist set-threshold <id> 0.25
    python -m kestrel watchlist set-price <id> 12.50
    python -m kestrel watchlist set-exclude <id> "proxy,custom,lot,digital,french,german"
    python -m kestrel watchlist grade-price set <id> PSA 9 120.00
    python -m kestrel watchlist grade-price list <id>
    python -m kestrel watchlist grade-price remove <id> PSA 9
    python -m kestrel poll        # one cycle — good for cron
    python -m kestrel poll --workers 8   # same, but rows checked concurrently (much faster on a big watchlist)
    python -m kestrel run         # loop forever, sleeping between cycles
    python -m kestrel run --workers 8
    python -m kestrel alerts unreviewed          # what's new since the last review pass
    python -m kestrel alerts mark <id> looks_good --notes "..."
    python -m kestrel alerts best [--limit 10]   # ranked, reviewed, not-rejected
    python -m kestrel purchases add-from-alert <alert_id> <price_paid> [--notes "..."]
    python -m kestrel purchases add --card-name ... --game ... --price ... [--set-name ...] [--card-number ...]
    python -m kestrel purchases list [--status to_list|listed|sold]
    python -m kestrel purchases mark-listed <id> <price>
    python -m kestrel purchases mark-sold <id> <price>
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from decimal import Decimal, InvalidOperation

import requests

from kestrel.alerts import get_alert, list_best, list_unreviewed, mark_reviewed
from kestrel.config import CONFIG
from kestrel.db import get_connection, init_db
from kestrel.ebay_client import EbayClient
from kestrel.grading import list_graded_prices, remove_graded_price, set_graded_price
from kestrel.models import PriceSource, PurchaseStatus, ReviewVerdict, Tier
from kestrel.poller import run_poll_cycle, run_poll_cycle_concurrent
from kestrel.purchases import add_purchase, add_purchase_from_alert, list_purchases, mark_listed, mark_sold
from kestrel.watchlist import (
    add_item,
    delete_item,
    get_item,
    list_items,
    set_active,
    set_discount_threshold,
    set_exclude_terms,
    set_manual_market_price,
)


def _configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, CONFIG.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    )


def _cmd_init_db(_args: argparse.Namespace) -> None:
    init_db(CONFIG.db_path)
    print(f"Initialized database at {CONFIG.db_path}")


def _cmd_watchlist_add(args: argparse.Namespace) -> None:
    price_source = PriceSource(args.price_source)
    manual_price = None
    if price_source == PriceSource.MANUAL:
        if args.manual_market_price is None:
            print("error: --manual-market-price is required when --price-source manual", file=sys.stderr)
            sys.exit(1)
        try:
            manual_price = Decimal(args.manual_market_price)
        except InvalidOperation:
            print(f"error: invalid --manual-market-price {args.manual_market_price!r}", file=sys.stderr)
            sys.exit(1)
    elif args.manual_market_price is not None:
        print("error: --manual-market-price only applies with --price-source manual", file=sys.stderr)
        sys.exit(1)

    threshold = Decimal(args.discount_threshold) if args.discount_threshold else CONFIG.default_discount_threshold

    init_db(CONFIG.db_path)
    with get_connection(CONFIG.db_path) as conn:
        item_id = add_item(
            conn,
            game=args.game,
            card_name=args.card_name,
            set_name=args.set_name,
            card_number=args.card_number,
            price_source=price_source,
            manual_market_price=manual_price,
            discount_threshold=threshold,
            search_terms=args.search_terms,
            exclude_terms=args.exclude_terms or "",
            tier=Tier(args.tier),
        )
    print(f"Added watchlist row {item_id}: {args.card_name}")


def _cmd_watchlist_list(_args: argparse.Namespace) -> None:
    init_db(CONFIG.db_path)
    with get_connection(CONFIG.db_path) as conn:
        items = list_items(conn)
    if not items:
        print("(watchlist is empty)")
        return
    for item in items:
        status = "active" if item.active else "disabled"
        price = f"manual={item.manual_market_price}" if item.price_source == PriceSource.MANUAL else "api"
        print(
            f"[{item.id:>3}] {status:8} {item.tier.value:8} {item.game:8} "
            f"{item.card_name} ({item.set_name or '-'} {item.card_number or '-'}) "
            f"threshold={item.discount_threshold} {price} "
            f"search={item.search_terms!r} exclude={item.exclude_terms!r} "
            f"last_polled={item.last_polled_at.isoformat() if item.last_polled_at else 'never'}"
        )


def _cmd_watchlist_enable(args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        set_active(conn, args.id, True)
    print(f"Enabled row {args.id}")


def _cmd_watchlist_set_threshold(args: argparse.Namespace) -> None:
    try:
        threshold = Decimal(args.threshold)
    except InvalidOperation:
        print(f"error: invalid threshold {args.threshold!r}", file=sys.stderr)
        sys.exit(1)
    with get_connection(CONFIG.db_path) as conn:
        set_discount_threshold(conn, args.id, threshold)
    print(f"Row {args.id}: discount_threshold set to {threshold}")


def _cmd_watchlist_set_price(args: argparse.Namespace) -> None:
    try:
        price = Decimal(args.price)
    except InvalidOperation:
        print(f"error: invalid price {args.price!r}", file=sys.stderr)
        sys.exit(1)
    with get_connection(CONFIG.db_path) as conn:
        set_manual_market_price(conn, args.id, price)
    print(f"Row {args.id}: manual_market_price set to {price}")


def _cmd_watchlist_grade_price_set(args: argparse.Namespace) -> None:
    try:
        grade = Decimal(args.grade)
        price = Decimal(args.price)
    except InvalidOperation:
        print(f"error: invalid grade {args.grade!r} or price {args.price!r}", file=sys.stderr)
        sys.exit(1)
    with get_connection(CONFIG.db_path) as conn:
        set_graded_price(conn, args.id, args.company, grade, price)
    print(f"Row {args.id}: {args.company.upper()} {grade} = £{price}")


def _cmd_watchlist_grade_price_list(args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        rows = list_graded_prices(conn, args.id)
    if not rows:
        print("(no graded prices set for this row)")
        return
    for row in rows:
        print(f"  {row.grading_company} {row.grade} = £{row.price_gbp}")


def _cmd_watchlist_grade_price_remove(args: argparse.Namespace) -> None:
    try:
        grade = Decimal(args.grade)
    except InvalidOperation:
        print(f"error: invalid grade {args.grade!r}", file=sys.stderr)
        sys.exit(1)
    with get_connection(CONFIG.db_path) as conn:
        remove_graded_price(conn, args.id, args.company, grade)
    print(f"Row {args.id}: removed {args.company.upper()} {grade}")


def _cmd_watchlist_set_exclude(args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        set_exclude_terms(conn, args.id, args.terms)
    print(f"Row {args.id}: exclude_terms set to {args.terms!r}")


def _cmd_watchlist_disable(args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        set_active(conn, args.id, False)
    print(f"Disabled row {args.id}")


def _cmd_watchlist_remove(args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        delete_item(conn, args.id)
    print(f"Removed row {args.id}")


def _cmd_poll(args: argparse.Namespace) -> None:
    init_db(CONFIG.db_path)
    if args.workers > 1:
        run_poll_cycle_concurrent(CONFIG, max_workers=args.workers)
    else:
        session = requests.Session()
        ebay = EbayClient(CONFIG, session)
        with get_connection(CONFIG.db_path) as conn:
            run_poll_cycle(conn, CONFIG, ebay, session)


def _cmd_run(args: argparse.Namespace) -> None:
    init_db(CONFIG.db_path)
    logger = logging.getLogger("kestrel.cli")
    logger.info("Starting Kestrel loop, polling every %ds (Ctrl+C to stop)", CONFIG.poll_interval_seconds)
    session = requests.Session()
    ebay = EbayClient(CONFIG, session)
    while True:
        try:
            if args.workers > 1:
                run_poll_cycle_concurrent(CONFIG, max_workers=args.workers)
            else:
                with get_connection(CONFIG.db_path) as conn:
                    run_poll_cycle(conn, CONFIG, ebay, session)
        except Exception:
            logger.exception("Poll cycle failed — will retry next cycle")
        time.sleep(CONFIG.poll_interval_seconds)


def _format_alert_row(a) -> str:
    reviewed = f"[{a.review_verdict.value}]" if a.review_verdict else "[unreviewed]"
    return (
        f"[{a.id:>4}] {reviewed:16} {a.card_name} — £{a.total_price_gbp} "
        f"({a.discount_pct}% off, est. net £{a.estimated_net_profit_gbp}) "
        f"condition={a.condition_hint!r} {a.listing_url}"
    )


def _cmd_alerts_unreviewed(_args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        rows = list_unreviewed(conn)
    if not rows:
        print("(nothing unreviewed — you're caught up)")
        return
    for row in rows:
        print(_format_alert_row(row))


def _cmd_alerts_mark(args: argparse.Namespace) -> None:
    try:
        verdict = ReviewVerdict(args.verdict)
    except ValueError:
        print(f"error: verdict must be one of {[v.value for v in ReviewVerdict]}", file=sys.stderr)
        sys.exit(1)
    with get_connection(CONFIG.db_path) as conn:
        if get_alert(conn, args.id) is None:
            print(f"error: no alert with id {args.id}", file=sys.stderr)
            sys.exit(1)
        mark_reviewed(conn, args.id, verdict, args.notes)
    print(f"Alert {args.id} marked {verdict.value}" + (f": {args.notes}" if args.notes else ""))


def _cmd_alerts_best(args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        rows = list_best(conn, limit=args.limit)
    if not rows:
        print("(nothing reviewed and not-rejected yet)")
        return
    for row in rows:
        print(_format_alert_row(row))
        if row.review_notes:
            print(f"       notes: {row.review_notes}")


def _cmd_alerts_cross_check(args: argparse.Namespace) -> None:
    """Cross-check an alert's market_price_gbp against PriceCharting's real
    Ungraded sold-comp price -- catches the class of bug where
    pokemontcg.io's cardmarket AND tcgplayer feeds happen to agree on a
    bad number (the pokemon.py sanity check can't catch that, since it
    only compares those two sources against each other)."""
    import requests

    from kestrel.pricing.pricecharting import fetch_ungraded_price_gbp

    with get_connection(CONFIG.db_path) as conn:
        alert = get_alert(conn, args.id)
        if alert is None:
            print(f"error: no alert with id {args.id}", file=sys.stderr)
            sys.exit(1)
        item = get_item(conn, alert.watchlist_id)

    if item is None:
        print(f"error: watchlist row for alert {args.id} no longer exists", file=sys.stderr)
        sys.exit(1)

    session = requests.Session()
    pc_price = fetch_ungraded_price_gbp(
        session, CONFIG.fx_usd_to_gbp, item.game, item.set_name, item.card_name, item.card_number
    )
    print(f"{item.card_name} ({item.set_name} {item.card_number})")
    print(f"  Our market_price_gbp:      £{alert.market_price_gbp}")
    if pc_price is None:
        print("  PriceCharting Ungraded:    not resolvable (set not mapped, or card not found)")
        return
    print(f"  PriceCharting Ungraded:    £{pc_price}")
    ratio = float(alert.market_price_gbp) / float(pc_price) if pc_price else None
    if ratio is not None:
        print(f"  Ratio (ours / theirs):     {ratio:.2f}x")
        if ratio > 3 or ratio < 1 / 3:
            print("  -> Large disagreement. Treat our price as unreliable for this card.")


def _format_purchase_row(p) -> str:
    parts = [f"[{p.id:>4}] {p.status.value:8} {p.card_name}"]
    if p.set_name:
        parts.append(f"({p.set_name} {p.card_number or ''})".strip())
    parts.append(f"bought £{p.bought_price_gbp}")
    if p.listed_price_gbp is not None:
        parts.append(f"listed £{p.listed_price_gbp}")
    if p.sold_price_gbp is not None:
        parts.append(f"sold £{p.sold_price_gbp}")
    if p.notes:
        parts.append(f"— {p.notes}")
    return " ".join(parts)


def _cmd_purchases_add_from_alert(args: argparse.Namespace) -> None:
    try:
        price = Decimal(args.price)
    except InvalidOperation:
        print(f"error: invalid price {args.price!r}", file=sys.stderr)
        sys.exit(1)
    init_db(CONFIG.db_path)
    with get_connection(CONFIG.db_path) as conn:
        try:
            purchase_id = add_purchase_from_alert(conn, args.alert_id, price, notes=args.notes)
        except ValueError as exc:
            print(f"error: {exc}", file=sys.stderr)
            sys.exit(1)
    print(f"Logged purchase {purchase_id} from alert {args.alert_id}: £{price}")


def _cmd_purchases_add(args: argparse.Namespace) -> None:
    try:
        price = Decimal(args.price)
    except InvalidOperation:
        print(f"error: invalid price {args.price!r}", file=sys.stderr)
        sys.exit(1)
    init_db(CONFIG.db_path)
    with get_connection(CONFIG.db_path) as conn:
        purchase_id = add_purchase(
            conn,
            card_name=args.card_name,
            game=args.game,
            set_name=args.set_name,
            card_number=args.card_number,
            bought_price_gbp=price,
            notes=args.notes,
        )
    print(f"Logged purchase {purchase_id}: {args.card_name} £{price}")


def _cmd_purchases_list(args: argparse.Namespace) -> None:
    status = PurchaseStatus(args.status) if args.status else None
    with get_connection(CONFIG.db_path) as conn:
        rows = list_purchases(conn, status=status)
    if not rows:
        print("(no purchases logged yet)")
        return
    for row in rows:
        print(_format_purchase_row(row))


def _cmd_purchases_mark_listed(args: argparse.Namespace) -> None:
    try:
        price = Decimal(args.price)
    except InvalidOperation:
        print(f"error: invalid price {args.price!r}", file=sys.stderr)
        sys.exit(1)
    with get_connection(CONFIG.db_path) as conn:
        mark_listed(conn, args.id, price)
    print(f"Purchase {args.id} marked listed at £{price}")


def _cmd_purchases_mark_sold(args: argparse.Namespace) -> None:
    try:
        price = Decimal(args.price)
    except InvalidOperation:
        print(f"error: invalid price {args.price!r}", file=sys.stderr)
        sys.exit(1)
    with get_connection(CONFIG.db_path) as conn:
        mark_sold(conn, args.id, price)
    print(f"Purchase {args.id} marked sold at £{price}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="kestrel", description="Local eBay UK trading card deal scanner")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("init-db", help="Create the SQLite schema").set_defaults(func=_cmd_init_db)

    watchlist = sub.add_parser("watchlist", help="Manage the watchlist")
    watchlist_sub = watchlist.add_subparsers(dest="watchlist_command", required=True)

    add = watchlist_sub.add_parser("add", help="Add a watchlist row")
    add.add_argument("--game", required=True, help="e.g. pokemon, yugioh, football")
    add.add_argument("--card-name", required=True)
    add.add_argument("--set-name", default=None)
    add.add_argument("--card-number", default=None)
    add.add_argument("--price-source", required=True, choices=[s.value for s in PriceSource])
    add.add_argument("--manual-market-price", default=None, help="Required when --price-source manual")
    add.add_argument("--discount-threshold", default=None, help=f"Default {CONFIG.default_discount_threshold}")
    add.add_argument("--search-terms", required=True, help="What to actually query eBay with")
    add.add_argument("--exclude-terms", default="", help="Comma-separated, e.g. proxy,custom,lot,digital")
    add.add_argument("--tier", default=Tier.STANDARD.value, choices=[t.value for t in Tier])
    add.set_defaults(func=_cmd_watchlist_add)

    watchlist_sub.add_parser("list", help="List all watchlist rows").set_defaults(func=_cmd_watchlist_list)

    enable = watchlist_sub.add_parser("enable", help="Re-enable a row")
    enable.add_argument("id", type=int)
    enable.set_defaults(func=_cmd_watchlist_enable)

    disable = watchlist_sub.add_parser("disable", help="Pause a row without deleting it")
    disable.add_argument("id", type=int)
    disable.set_defaults(func=_cmd_watchlist_disable)

    remove = watchlist_sub.add_parser("remove", help="Delete a row")
    remove.add_argument("id", type=int)
    remove.set_defaults(func=_cmd_watchlist_remove)

    set_threshold = watchlist_sub.add_parser("set-threshold", help="Change a row's discount_threshold")
    set_threshold.add_argument("id", type=int)
    set_threshold.add_argument("threshold", help="e.g. 0.25 for 25%%")
    set_threshold.set_defaults(func=_cmd_watchlist_set_threshold)

    set_price = watchlist_sub.add_parser("set-price", help="Change a manual row's manual_market_price")
    set_price.add_argument("id", type=int)
    set_price.add_argument("price")
    set_price.set_defaults(func=_cmd_watchlist_set_price)

    set_exclude = watchlist_sub.add_parser("set-exclude", help="Replace a row's comma-separated exclude_terms")
    set_exclude.add_argument("id", type=int)
    set_exclude.add_argument("terms", help='e.g. "proxy,custom,lot,digital,french,german"')
    set_exclude.set_defaults(func=_cmd_watchlist_set_exclude)

    grade_price = watchlist_sub.add_parser(
        "grade-price", help="Manual per-grade market prices for this row (see kestrel/grading.py)"
    )
    grade_price_sub = grade_price.add_subparsers(dest="grade_price_command", required=True)

    gp_set = grade_price_sub.add_parser("set", help="Set/update the price for one grade")
    gp_set.add_argument("id", type=int)
    gp_set.add_argument("company", help="PSA, BGS, CGC, SGC, or ACE")
    gp_set.add_argument("grade", help="e.g. 9, 9.5, 10")
    gp_set.add_argument("price", help="What this exact card at that exact grade is worth, in GBP")
    gp_set.set_defaults(func=_cmd_watchlist_grade_price_set)

    gp_list = grade_price_sub.add_parser("list", help="List graded prices set for this row")
    gp_list.add_argument("id", type=int)
    gp_list.set_defaults(func=_cmd_watchlist_grade_price_list)

    gp_remove = grade_price_sub.add_parser("remove", help="Remove a graded price")
    gp_remove.add_argument("id", type=int)
    gp_remove.add_argument("company")
    gp_remove.add_argument("grade")
    gp_remove.set_defaults(func=_cmd_watchlist_grade_price_remove)

    poll = sub.add_parser("poll", help="Run a single poll cycle (use with cron)")
    poll.add_argument("--workers", type=int, default=1, help="Evaluate rows concurrently across N threads (default 1 = sequential)")
    poll.set_defaults(func=_cmd_poll)

    run = sub.add_parser("run", help="Loop forever, polling every POLL_INTERVAL_SECONDS")
    run.add_argument("--workers", type=int, default=1, help="Evaluate rows concurrently across N threads (default 1 = sequential)")
    run.set_defaults(func=_cmd_run)

    alerts = sub.add_parser("alerts", help="The persisted alert log + review workflow")
    alerts_sub = alerts.add_subparsers(dest="alerts_command", required=True)

    alerts_sub.add_parser("unreviewed", help="Everything logged since the last review pass").set_defaults(
        func=_cmd_alerts_unreviewed
    )

    mark = alerts_sub.add_parser("mark", help="Record a review verdict for one alert")
    mark.add_argument("id", type=int)
    mark.add_argument("verdict", choices=[v.value for v in ReviewVerdict])
    mark.add_argument("--notes", default=None)
    mark.set_defaults(func=_cmd_alerts_mark)

    best = alerts_sub.add_parser("best", help="Reviewed, not-rejected alerts ranked by estimated net profit")
    best.add_argument("--limit", type=int, default=10)
    best.set_defaults(func=_cmd_alerts_best)

    cross_check = alerts_sub.add_parser(
        "cross-check", help="Compare an alert's market_price_gbp against PriceCharting's real sold-comp price"
    )
    cross_check.add_argument("id", type=int)
    cross_check.set_defaults(func=_cmd_alerts_cross_check)

    purchases = sub.add_parser("purchases", help="Cards actually bought -- the 'what to list it at' inventory")
    purchases_sub = purchases.add_subparsers(dest="purchases_command", required=True)

    add_from_alert = purchases_sub.add_parser("add-from-alert", help="Log a purchase, pulling card identity from an alert")
    add_from_alert.add_argument("alert_id", type=int)
    add_from_alert.add_argument("price", help="What you actually paid, in GBP")
    add_from_alert.add_argument("--notes", default=None)
    add_from_alert.set_defaults(func=_cmd_purchases_add_from_alert)

    add_manual = purchases_sub.add_parser("add", help="Log a purchase manually (no source alert)")
    add_manual.add_argument("--card-name", required=True)
    add_manual.add_argument("--game", required=True)
    add_manual.add_argument("--set-name", default=None)
    add_manual.add_argument("--card-number", default=None)
    add_manual.add_argument("--price", required=True, help="What you actually paid, in GBP")
    add_manual.add_argument("--notes", default=None)
    add_manual.set_defaults(func=_cmd_purchases_add)

    list_purchases_parser = purchases_sub.add_parser("list", help="List logged purchases")
    list_purchases_parser.add_argument("--status", choices=[s.value for s in PurchaseStatus], default=None)
    list_purchases_parser.set_defaults(func=_cmd_purchases_list)

    mark_listed_parser = purchases_sub.add_parser("mark-listed", help="Record the price you actually listed it at")
    mark_listed_parser.add_argument("id", type=int)
    mark_listed_parser.add_argument("price")
    mark_listed_parser.set_defaults(func=_cmd_purchases_mark_listed)

    mark_sold_parser = purchases_sub.add_parser("mark-sold", help="Record the price it actually sold for")
    mark_sold_parser.add_argument("id", type=int)
    mark_sold_parser.add_argument("price")
    mark_sold_parser.set_defaults(func=_cmd_purchases_mark_sold)

    return parser


def main(argv: list[str] | None = None) -> None:
    _configure_logging()
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
