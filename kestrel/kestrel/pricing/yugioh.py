"""
Yu-Gi-Oh market pricing via YGOPRODeck (free, no API key/auth required).

Added in place of the brief's Pokemon-only pokemontcg.io source, since
YGOPRODeck is the equivalent free official API for Yu-Gi-Oh (aggregates
TCGplayer/Cardmarket prices — not us scraping either site directly).

Real bug found and fixed here: `card_prices` (the field this module used to
return unconditionally) is a single price *per card name*, blended across
every printing that card has ever had — for a card reprinted dozens of
times since 2002 (Red-Eyes Black Dragon, say), that collapses to whatever
the cheapest current reprint costs (~£0.14), nowhere near what an actual
vintage first-print copy is worth (its real Legend of Blue Eyes White
Dragon printing prices at ~$40 via the set-specific field below). Every
watchlist row using the old behavior would have compared real eBay listings
against a near-zero reference price and never fired a single real alert.

Fix: when a row gives `set_name` (and ideally `card_number`, holding the
exact set_code like "LOB-070" for disambiguation), look up that specific
printing in the card's `card_sets` array and use *its* `set_price` instead
of the generic figure. `set_price` isn't labeled with a currency in the
API response; empirically it lines up with TCGplayer (USD) figures, so it's
converted via FX_USD_TO_GBP_RATE — same assumption/limitation as this
module's own tcgplayer_price fallback. Falls back to the old generic
card-level price when no set_name is given, or no set-specific price is
found — existing manual-set-name-less rows are unaffected.
"""

from __future__ import annotations

import re
import time
from decimal import Decimal
from typing import Any

import requests

from kestrel.config import Config

# Same retry pattern as pricing/pokemon.py -- confirmed live there that
# these free card-pricing APIs return plain transient 500/502s often enough
# that a single unretried request silently drops real watchlist coverage.
_MAX_RETRIES = 3
_RETRY_BACKOFF_SECONDS = 2.0

# Multiple `card_sets` entries can share one `set_name` (regional/reprint
# variants of "the same" set under Konami's branding, e.g. "LOB-070" vs
# "LOB-E056" vs "LOB-EN070" for one card) — sometimes 10x+ apart in price.
# Prefer the *unsuffixed* set_code (plain "LOB-070"), since that's the
# original-print code format predating Konami's later "-EN"/language-suffix
# convention — closest to a vintage set's "true first" printing. This is a
# judgment call, not a certainty: spot-check with `watchlist set-price` if a
# specific card's reference price looks off.
_PLAIN_SET_CODE_RE = re.compile(r"^[A-Z0-9]+-\d+[A-Z]?$")


def _extract_generic_price_gbp(card: dict[str, Any], config: Config) -> Decimal | None:
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


def _extract_set_specific_price_gbp(
    card: dict[str, Any],
    config: Config,
    set_name: str,
    card_number: str | None,
) -> Decimal | None:
    matches = [cs for cs in (card.get("card_sets") or []) if cs.get("set_name") == set_name]
    if not matches:
        return None

    def priced(cs: dict[str, Any]) -> Decimal | None:
        raw = cs.get("set_price")
        value = Decimal(str(raw)) if raw not in (None, "") else None
        return value if value and value > 0 else None

    # Exact set_code match (e.g. watchlist row's card_number = "LOB-070")
    # wins outright — no ambiguity left to guess at.
    if card_number:
        exact = next((cs for cs in matches if cs.get("set_code") == card_number), None)
        if exact:
            price = priced(exact)
            if price is not None:
                return (price * config.fx_usd_to_gbp).quantize(Decimal("0.01"))

    plain = [cs for cs in matches if _PLAIN_SET_CODE_RE.match(cs.get("set_code") or "") and priced(cs)]
    if plain:
        return (priced(plain[0]) * config.fx_usd_to_gbp).quantize(Decimal("0.01"))

    any_priced = next((cs for cs in matches if priced(cs)), None)
    if any_priced:
        return (priced(any_priced) * config.fx_usd_to_gbp).quantize(Decimal("0.01"))

    return None


def fetch_market_price_gbp(
    session: requests.Session,
    config: Config,
    card_name: str,
    set_name: str | None = None,
    card_number: str | None = None,
) -> Decimal | None:
    resp = None
    for attempt in range(_MAX_RETRIES + 1):
        resp = session.get(
            f"{config.ygoprodeck_base_url}/cardinfo.php",
            params={"name": card_name},
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
    if set_name:
        set_price = _extract_set_specific_price_gbp(card, config, set_name, card_number)
        if set_price is not None:
            return set_price

    return _extract_generic_price_gbp(card, config)
