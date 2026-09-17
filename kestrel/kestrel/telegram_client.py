"""
Phase 2 — Telegram alerts.

Simple bot via the plain HTTP Bot API (no SDK — it's just POSTing form data),
per the build brief. One outbound message per match: card name, game,
listing price, market price, discount %, time remaining + max bid for
auctions, the card image, and a button linking straight to the listing.

This module never places a bid or completes a purchase — the "buy" link is
just a button that opens the real eBay listing in the user's own browser;
they do everything from there themselves.

A missing/invalid bot token or chat ID disables this module entirely
(returns False, logs once) rather than crashing the poll cycle — Telegram
being down or unconfigured should never stop console/log output.
"""

from __future__ import annotations

import html
import json
import logging

import requests

from kestrel.config import Config
from kestrel.models import ListingType, MatchResult

logger = logging.getLogger("kestrel.telegram")

API_BASE = "https://api.telegram.org"


def is_configured(config: Config) -> bool:
    return bool(config.telegram_bot_token and config.telegram_chat_id)


def _format_message(match: MatchResult) -> str:
    listing = match.listing
    item = match.watchlist_item

    is_graded_priced = match.detected_grade is not None and match.graded_market_price_gbp is not None

    lines = [
        f"<b>{html.escape(item.card_name)}</b>" + (f" ({html.escape(item.set_name)})" if item.set_name else ""),
        f"{html.escape(item.game)} · {listing.listing_type.value.replace('_', ' ')}",
        "",
        f"Listing price: <b>£{listing.total_price}</b> (incl. postage £{listing.shipping_price})",
    ]

    if match.detected_grade is not None:
        grade_label = f"{html.escape(match.detected_grade.company)} {match.detected_grade.grade}"
        if is_graded_priced:
            lines.append(f"GRADED ({grade_label}) — your entered price: <b>£{match.graded_market_price_gbp}</b>")
            lines.append(f"Discount: <b>{match.discount_pct}% below YOUR GRADED PRICE</b> (cap/est. profit below are against it too, not raw)")
        else:
            lines.append(f"GRADED ({grade_label}) — no manual price entered for this grade (<code>watchlist grade-price set</code>)")
            lines.append(f"Discount: <b>{match.discount_pct}% below RAW/ungraded market</b> — likely meaningless for a graded card, treat with real caution")
    else:
        lines.append(f"Discount: <b>{match.discount_pct}% below market</b> (gross, before fees)")

    lines += [
        f"Market price: £{match.market_price_gbp} (raw/ungraded reference price)",
        f"Condition (seller-declared where available, else a title guess): <b>{html.escape(match.condition_hint)}</b>",
        f"Est. net profit after fees/postage: <b>£{match.estimated_net_profit_gbp}</b> (breakeven cap: £{match.net_breakeven_cap_gbp})",
    ]

    if match.price_confidence_pct is not None:
        lines.append(f"Price confidence: <b>{match.price_confidence_pct}%</b> (heuristic, not a guarantee)")

    if listing.accepts_best_offer:
        if match.suggested_offer_gbp is not None:
            lines.append(f"Make Offer accepted — suggest offering: <b>£{match.suggested_offer_gbp}</b>")
        else:
            lines.append("Make Offer accepted, but no offer below asking still clears a profitable margin")

    if listing.seller_username:
        feedback = (
            f"{listing.seller_feedback_score} feedback, {listing.seller_feedback_pct}% positive"
            if listing.seller_feedback_score is not None
            else "no feedback history"
        )
        lines.append(f"Seller: {html.escape(listing.seller_username)} ({html.escape(feedback)})")

    if listing.listing_type == ListingType.AUCTION:
        lines.append(f"Current bid: £{listing.current_bid_price} ({listing.bid_count} bids)")
        if listing.item_end_date:
            lines.append(f"Ends: {listing.item_end_date.strftime('%H:%M UTC')}")
        # Plain, copyable text for a sniping service — never used by Kestrel itself.
        lines.append(f"Max bid to copy into a sniper: <b>£{match.max_bid_gbp}</b>")

    lines.append("")
    lines.append(f"<a href=\"{html.escape(listing.item_web_url)}\">{html.escape(listing.item_web_url)}</a>")

    return "\n".join(lines)


def _buy_button(listing_url: str) -> dict:
    return {"inline_keyboard": [[{"text": "View listing on eBay", "url": listing_url}]]}


def send_alert(config: Config, match: MatchResult, session: requests.Session | None = None) -> bool:
    """
    Send one Telegram alert for a match. Returns True on success, False on
    any failure (missing config, network error, non-200 from Telegram) —
    never raises, so a Telegram outage can't take down a poll cycle.
    """
    if not is_configured(config):
        logger.debug("Telegram not configured (missing bot token or chat id) — skipping alert")
        return False

    session = session or requests.Session()
    text = _format_message(match)
    reply_markup = _buy_button(match.listing.item_web_url)
    base_url = f"{API_BASE}/bot{config.telegram_bot_token}"

    try:
        if match.listing.image_url:
            resp = session.post(
                f"{base_url}/sendPhoto",
                data={
                    "chat_id": config.telegram_chat_id,
                    "photo": match.listing.image_url,
                    "caption": text,
                    "parse_mode": "HTML",
                    "reply_markup": json.dumps(reply_markup),
                },
                timeout=15,
            )
        else:
            resp = session.post(
                f"{base_url}/sendMessage",
                data={
                    "chat_id": config.telegram_chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "reply_markup": json.dumps(reply_markup),
                },
                timeout=15,
            )
    except requests.exceptions.RequestException:
        logger.warning("Telegram send failed (network error) for item %s", match.listing.item_id, exc_info=True)
        return False

    if resp.status_code != 200:
        logger.warning("Telegram send failed (%s) for item %s: %s", resp.status_code, match.listing.item_id, resp.text[:300])
        return False

    return True
