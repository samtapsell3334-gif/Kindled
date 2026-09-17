"""
Pokemon market pricing via pokemontcg.io (free; 1,000 req/day without an API
key, 20,000/day with one — set POKEMONTCG_API_KEY once the watchlist grows).

pokemontcg.io doesn't return GBP. We prefer the `cardmarket` block (EUR,
European secondary market — closer to a UK eBay comp than the US TCGplayer
figures) and convert with the static FX_EUR_TO_GBP_RATE from config. See
config.py for why this is a static rate rather than a live feed.

Real gap found and fixed here: brand-new sets can have `cardmarket: null`
entirely — confirmed live against the whole of Prismatic Evolutions and
Surging Sparks (both released within the last year), where every single
card came back with no cardmarket block at all, only `tcgplayer` (USD).
Without a fallback, every card in a set like that silently prices as "no
market price available" forever, the same class of quiet failure as the
Yu-Gi-Oh generic-price bug (see pricing/yugioh.py). Falls back to
`tcgplayer.prices` (any variant — normal/holofoil/reverseHolofoil/etc.,
preferring holofoil since these are usually a set's holo-rarity chase
cards) converted via FX_USD_TO_GBP_RATE when cardmarket has nothing usable.
"""

from __future__ import annotations

import time
from decimal import Decimal
from typing import Any

import requests

from kestrel.config import Config

BASE_QUERY_FIELDS = ["cardmarket"]

# pokemontcg.io is noticeably unreliable in practice -- confirmed live via a
# direct sample: 4 of 5 consecutive requests came back 500/502 (Cloudflare,
# no rate-limit headers, so this is general backend instability, not a
# daily-quota 429). Without a retry, a single row's price lookup silently
# fails on what's often just a coin flip -- across a few hundred watchlist
# rows that meant real, wide gaps in a poll cycle's coverage, not just a
# rare edge case. Same fix pattern already used in the seed scripts and
# purchases.refresh_market_rate.
_MAX_RETRIES = 3
_RETRY_BACKOFF_SECONDS = 2.0

# Preference order when a card has more than one tcgplayer price variant —
# holofoil/reverseHolofoil are usually a set's premium prints (what most
# vintage 1st-Edition-era watchlist rows care about); "normal" is the
# common/no-holo print. Neither is "the edition" — pokemontcg.io doesn't
# split by print edition at all, see the seed script's own caveat.
_TCGPLAYER_VARIANT_PREFERENCE = ("holofoil", "reverseHolofoil", "normal", "1stEditionHolofoil", "1stEditionNormal")


def _build_query(card_name: str, set_name: str | None, card_number: str | None) -> str:
    clauses = [f'name:"{card_name}"']
    if set_name:
        clauses.append(f'set.name:"{set_name}"')
    if card_number:
        # pokemontcg.io stores just the numerator ("4"), not the collector
        # format most people write ("4/102") — strip the denominator so a
        # watchlist row filled in the normal collector convention still
        # matches instead of silently returning zero results.
        numerator = card_number.split("/", 1)[0].strip()
        clauses.append(f'number:"{numerator}"')
    return " ".join(clauses)


def _extract_price_eur(card: dict[str, Any]) -> Decimal | None:
    cardmarket = card.get("cardmarket") or {}
    prices = cardmarket.get("prices") or {}
    for field in ("trendPrice", "averageSellPrice", "avg30", "avg7"):
        value = prices.get(field)
        if value:
            return Decimal(str(value))
    return None


def _extract_price_usd(card: dict[str, Any]) -> Decimal | None:
    tcgplayer = card.get("tcgplayer") or {}
    prices = tcgplayer.get("prices") or {}
    if not prices:
        return None

    ordered_variants = [v for v in _TCGPLAYER_VARIANT_PREFERENCE if v in prices]
    ordered_variants += [v for v in prices if v not in _TCGPLAYER_VARIANT_PREFERENCE]

    for variant in ordered_variants:
        entry = prices.get(variant) or {}
        for field in ("market", "mid", "low"):
            value = entry.get(field)
            if value:
                return Decimal(str(value))
    return None


def fetch_market_price_gbp(
    session: requests.Session,
    config: Config,
    card_name: str,
    set_name: str | None,
    card_number: str | None,
) -> Decimal | None:
    headers = {}
    if config.pokemontcg_api_key:
        headers["X-Api-Key"] = config.pokemontcg_api_key

    resp = None
    for attempt in range(_MAX_RETRIES + 1):
        resp = session.get(
            f"{config.pokemontcg_base_url}/cards",
            params={"q": _build_query(card_name, set_name, card_number), "pageSize": "5"},
            headers=headers,
            timeout=15,
        )
        if resp.status_code == 200:
            break
        if attempt < _MAX_RETRIES:
            time.sleep(_RETRY_BACKOFF_SECONDS * (attempt + 1))
    if resp is None or resp.status_code != 200:
        return None

    cards = resp.json().get("data") or []
    if not cards:
        return None

    card = cards[0]
    price_eur = _extract_price_eur(card)
    if price_eur is not None:
        return (price_eur * config.fx_eur_to_gbp).quantize(Decimal("0.01"))

    price_usd = _extract_price_usd(card)
    if price_usd is not None:
        return (price_usd * config.fx_usd_to_gbp).quantize(Decimal("0.01"))

    return None
