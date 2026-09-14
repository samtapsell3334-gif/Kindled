"""
Command-line entry point.

    python -m kestrel init-db
    python -m kestrel watchlist add ...
    python -m kestrel watchlist list
    python -m kestrel watchlist enable|disable|remove <id>
    python -m kestrel poll        # one cycle — good for cron
    python -m kestrel run         # loop forever, sleeping between cycles
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from decimal import Decimal, InvalidOperation

import requests

from kestrel.config import CONFIG
from kestrel.db import get_connection, init_db
from kestrel.ebay_client import EbayClient
from kestrel.models import PriceSource, Tier
from kestrel.poller import run_poll_cycle
from kestrel.watchlist import add_item, delete_item, list_items, set_active


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


def _cmd_watchlist_disable(args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        set_active(conn, args.id, False)
    print(f"Disabled row {args.id}")


def _cmd_watchlist_remove(args: argparse.Namespace) -> None:
    with get_connection(CONFIG.db_path) as conn:
        delete_item(conn, args.id)
    print(f"Removed row {args.id}")


def _cmd_poll(_args: argparse.Namespace) -> None:
    init_db(CONFIG.db_path)
    session = requests.Session()
    ebay = EbayClient(CONFIG, session)
    with get_connection(CONFIG.db_path) as conn:
        run_poll_cycle(conn, CONFIG, ebay, session)


def _cmd_run(_args: argparse.Namespace) -> None:
    init_db(CONFIG.db_path)
    session = requests.Session()
    ebay = EbayClient(CONFIG, session)
    logger = logging.getLogger("kestrel.cli")
    logger.info("Starting Kestrel loop, polling every %ds (Ctrl+C to stop)", CONFIG.poll_interval_seconds)
    while True:
        try:
            with get_connection(CONFIG.db_path) as conn:
                run_poll_cycle(conn, CONFIG, ebay, session)
        except Exception:
            logger.exception("Poll cycle failed — will retry next cycle")
        time.sleep(CONFIG.poll_interval_seconds)


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

    sub.add_parser("poll", help="Run a single poll cycle (use with cron)").set_defaults(func=_cmd_poll)
    sub.add_parser("run", help="Loop forever, polling every POLL_INTERVAL_SECONDS").set_defaults(func=_cmd_run)

    return parser


def main(argv: list[str] | None = None) -> None:
    _configure_logging()
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
