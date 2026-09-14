"""
Yu-Gi-Oh market pricing via YGOPRODeck (free, no API key/auth required).

Added in place of the brief's Pokemon-only pokemontcg.io source, since
YGOPRODeck is the equivalent free official API for Yu-Gi-Oh (aggregates
TCGplayer/Cardmarket prices — not us scraping either site directly).

YGOPRODeck prices a card overall rather than per printing, so unlike Pokemon
`set_name`/`card_number` don't narrow the query further here — only
`card_name` is used. Prefer the `cardmarket_price` (EUR) field over
`tcgplayer_price` (USD) for the same reason as the Pokemon source: EUR is a
closer proxy for a UK price than USD. Converted to GBP via the static
FX_EUR_TO_GBP_RATE / FX_USD_TO_GBP_RATE config values.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

import requests

from kestrel.config import Config


def _extract_price_gbp(card: dict[str, Any], config: Config) -> Decimal | None:
    price_entries = card.get("card_prices") or []
    if not price_entries:
        return None
    prices = price_entries[0]

    cardmarket = prices.get("cardmarket_price")
    if cardmarket and Decimal(str(cardmarket)) > 0:
        return (Decimal(str(cardmarket)) * config.fx_eur_to_gbp).quantize(Decimal("0.01"))

    tcgplayer = prices.get("tcgplayer_price")
    if tcgplayer and Decimal(str(tcgplayer)) > 0:
        return (Decimal(str(tcgplayer)) * config.fx_usd_to_gbp).quantize(Decimal("0.01"))

    return None


def fetch_market_price_gbp(
    session: requests.Session,
    config: Config,
    card_name: str,
) -> Decimal | None:
    resp = session.get(
        f"{config.ygoprodeck_base_url}/cardinfo.php",
        params={"name": card_name},
        timeout=15,
    )
    if resp.status_code != 200:
        return None

    cards = resp.json().get("data") or []
    if not cards:
        return None

    return _extract_price_gbp(cards[0], config)
