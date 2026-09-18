"""
Real-sold-comp cross-check via PriceCharting.com.

Why this exists: pokemontcg.io's cardmarket/tcgplayer feeds are reference
"trend" prices, not sold comps -- and both have been caught live, twice,
returning badly wrong numbers with no signal they're wrong (Jungle
Clefable ~5x, a common Bulbasaur ~300x, see pricing/pokemon.py). eBay's own
Buy Browse API has no sold-comp endpoint at all, and eBay's Marketplace
Insights API (the one that does) is gated to approved partners -- confirmed
live, this account's credentials get a clean 400 invalid_scope requesting
it. PriceCharting publishes a real price guide (their own claim: built from
tracked sold listings) with a proper "Ungraded" price point for graded
collectibles including Pokemon and Yu-Gi-Oh cards, and its pages are
fetchable directly (no API key, robots.txt allows it outside unrelated
/buy /publish-offer /stripe-connect paths).

There is no official PriceCharting search API usable here -- their
/search-products endpoint returns a JS-rendered page with no results in
the raw HTML (confirmed live), so this resolves a card by browsing its
set's console page (`/console/<set-slug>`) and matching by card number,
the same approach a human would use clicking through the site. This is a
cross-check tool for spot-verifying specific cards, not a wired-in
per-poll pricing source -- see README for why it isn't (rate-limiting and
slug-mapping robustness for the full ~485-row watchlist is unsolved).
"""

from __future__ import annotations

import re
import time
from decimal import Decimal

import requests

_BASE_URL = "https://www.pricecharting.com"
_REQUEST_DELAY_SECONDS = 1.5
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; Kestrel price cross-check)"}

# PriceCharting's own set-slug spelling doesn't derive mechanically from
# our set_name -- confirmed live per set as each one was checked.
_POKEMON_SET_SLUGS = {
    "base": "pokemon-base-set",
    "jungle": "pokemon-jungle",
    "fossil": "pokemon-fossil",
    "neo destiny": "pokemon-neo-destiny",
    "neo genesis": "pokemon-neo-genesis",
    "legendary collection": "pokemon-legendary-collection",
    "team rocket": "pokemon-team-rocket",
    "evolving skies": "pokemon-evolving-skies",
    "prismatic evolutions": "pokemon-prismatic-evolutions",
    "pop series 5": "pokemon-pop-series-5",
}

_YUGIOH_SET_SLUGS = {
    "metal raiders": "yugioh-metal-raiders",
    "legend of blue eyes white dragon": "yugioh-legend-of-blue-eyes-white-dragon",
    "pharaoh's servant": "yugioh-pharaohs-servant",
}


def _console_slug(game: str, set_name: str | None) -> str | None:
    table = _POKEMON_SET_SLUGS if game == "pokemon" else _YUGIOH_SET_SLUGS
    return table.get((set_name or "").strip().lower())


def _numerator(card_number: str | None) -> str | None:
    if not card_number:
        return None
    # Pokemon numbers are "collector/set-total" (only the numerator maps to
    # PriceCharting's slug); Yu-Gi-Oh numbers are already a full set code
    # ("MRD-060") with no slash, and PriceCharting lowercases it in the slug.
    return card_number.split("/", 1)[0].strip().lower()


def resolve_card_slug(
    session: requests.Session, game: str, set_name: str | None, card_name: str, card_number: str | None
) -> str | None:
    """Browse the set's console page and find this card's product slug by
    number match -- PriceCharting's own card-name spelling in the slug
    (punctuation, "1st Edition" suffixes) isn't worth reproducing by hand."""
    console_slug = _console_slug(game, set_name)
    number = _numerator(card_number)
    if console_slug is None or number is None:
        return None

    resp = session.get(f"{_BASE_URL}/console/{console_slug}", headers=_HEADERS, timeout=20)
    if resp.status_code != 200:
        return None

    name_key = re.sub(r"[^a-z0-9]+", "-", card_name.strip().lower()).strip("-")
    pattern = re.compile(rf'href="/game/{re.escape(console_slug)}/([a-z0-9-]+-{re.escape(number)})"')
    candidates = pattern.findall(resp.text)
    if not candidates:
        return None

    # Prefer the plain (non-"1st-edition", non-"reverse-holo") printing
    # whose slug actually contains the card's name -- a set page lists
    # every variant under the same number.
    plain = [c for c in candidates if name_key in c and "1st-edition" not in c and "reverse" not in c]
    return (plain or candidates)[0]


def fetch_ungraded_price_gbp(
    session: requests.Session,
    fx_usd_to_gbp: Decimal,
    game: str,
    set_name: str | None,
    card_name: str,
    card_number: str | None,
) -> Decimal | None:
    """The 'Ungraded' price point off a resolved card's PriceCharting page,
    converted to GBP. None if the set isn't mapped, the card can't be
    found on its set page, or the page has no ungraded price listed."""
    slug = resolve_card_slug(session, game, set_name, card_name, card_number)
    if slug is None:
        return None

    time.sleep(_REQUEST_DELAY_SECONDS)
    console_slug = _console_slug(game, set_name)
    resp = session.get(f"{_BASE_URL}/game/{console_slug}/{slug}", headers=_HEADERS, timeout=20)
    if resp.status_code != 200:
        return None

    match = re.search(r'id="used_price">\s*<span class="price js-price">\s*\$([0-9,]+\.[0-9]{2})', resp.text)
    if not match:
        return None

    usd = Decimal(match.group(1).replace(",", ""))
    if usd == 0:
        return None
    return (usd * fx_usd_to_gbp).quantize(Decimal("0.01"))
