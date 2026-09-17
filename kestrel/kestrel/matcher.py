"""
Pure matching logic: given a listing, a watchlist rule, and a market price,
decide whether it's a deal. No I/O here — this is the part that gets unit
tested, per CLAUDE.md's rule that anything touching money needs tests, which
we're following as good practice even though this is a separate codebase
from the Kindled app.

Note on Decimal arithmetic: Kindled's TS convention (`.add()`/`.sub()`/
`.mul()` instead of `+`/`-`/`*`) exists because Prisma's JS `Decimal` class
doesn't overload operators safely. Python's `decimal.Decimal` does overload
them correctly (no float coercion), so plain `+`/`-`/`*`/`/` on `Decimal`
values here is the idiomatic and safe choice — this isn't the JS rule being
ignored, it's a different language with a different Decimal implementation.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from kestrel.models import EbayListing, ListingType, MatchResult, WatchlistItem

TWO_PLACES = Decimal("0.01")


def quantize_money(value: Decimal) -> Decimal:
    """Round to 2dp using ROUND_HALF_UP, matching the platform-wide rounding rule."""
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def max_bid(market_price: Decimal, discount_threshold: Decimal) -> Decimal:
    """The price cap: market * (1 - threshold), e.g. market=100, threshold=0.40 -> 60.00."""
    cap = market_price * (Decimal("1") - discount_threshold)
    return quantize_money(cap)


def discount_percentage(total_price: Decimal, market_price: Decimal) -> Decimal:
    """How far below market the total (price + postage) sits, as a percentage."""
    if market_price == 0:
        return Decimal("0")
    pct = (Decimal("1") - (total_price / market_price)) * Decimal("100")
    return pct.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def net_breakeven_cap(market_price: Decimal, fee_rate: Decimal, resale_postage: Decimal) -> Decimal:
    """
    The real ceiling: the most you could pay and still break even after
    reselling at market_price, once eBay's seller fee and your own outbound
    postage are taken out. Unlike max_bid() (the gross, threshold-based
    cap that decides whether an alert fires at all), this is purely
    informational -- the number that actually answers "is this worth it
    after costs," which the headline discount % never did.
    """
    cap = market_price * (Decimal("1") - fee_rate) - resale_postage
    return quantize_money(cap)


def estimate_net_profit(acquisition_cost: Decimal, market_price: Decimal, fee_rate: Decimal, resale_postage: Decimal) -> Decimal:
    """
    Estimated real profit (can be negative) from buying this specific
    listing at acquisition_cost (price + postage-in, i.e. listing.total_price)
    and reselling at market_price. Same fee/postage assumptions as
    net_breakeven_cap -- see config.py for why these are estimates to tune,
    not live-looked-up numbers.
    """
    net_proceeds = net_breakeven_cap(market_price, fee_rate, resale_postage)
    return quantize_money(net_proceeds - acquisition_cost)


def title_is_excluded(title: str, exclude_terms: list[str]) -> bool:
    lowered = title.lower()
    return any(term in lowered for term in exclude_terms if term)


# Common markers for a non-English printing on a cross-listed EU/Asia
# listing -- both Pokemon and Yu-Gi-Oh have wide multi-language reprints,
# and title_matches_card_name() only checks the English card name appears
# somewhere in the title, not that the physical card is the English print
# (a bilingual listing like "Charizard 4/102 Glurak Base Set DE" still
# passes that check). A foreign-language copy is a different, usually
# less valuable, print of "the same" card, so it's excluded the same way
# condition/scam terms are. Full words and bracket tags only, deliberately
# never bare 2-letter codes ("fr", "de") -- those would substring-match
# "from"/"deal" and silently exclude huge numbers of genuine English
# listings, which is a worse failure than occasionally missing a
# foreign-language listing that doesn't label itself.
NON_ENGLISH_GUARD_TERMS = [
    "french", "français", "francais",
    "german", "deutsch",
    "italian", "italiano",
    "spanish", "español", "espanol",
    "japanese",
    "korean",
    "chinese",
    "portuguese",
    "dutch", "nederlands",
    "polska",
    "(fr)", "(de)", "(it)", "(es)", "(jp)", "(kr)", "(cn)", "(pt)", "(nl)", "(pl)",
]


def with_non_english_guard(exclude_terms: str) -> str:
    """Append NON_ENGLISH_GUARD_TERMS to a row's comma-separated
    exclude_terms, skipping any already present (case-insensitive) so this
    is safe to re-apply to a row more than once."""
    existing = [t.strip() for t in exclude_terms.split(",") if t.strip()]
    existing_lower = {t.lower() for t in existing}
    merged = existing + [t for t in NON_ENGLISH_GUARD_TERMS if t not in existing_lower]
    return ",".join(merged)


_PUNCTUATION_RE = re.compile(r"[\-|:/,.!\[\]()]+")
_WHITESPACE_RE = re.compile(r"\s+")


def _normalize_for_match(text: str) -> str:
    """Lowercase, fold common punctuation to spaces, collapse whitespace —
    so "Ten-Thousand Dragon" and "Ten Thousand Dragon" compare equal, but
    the check stays a real substring match rather than a fuzzy one."""
    folded = _PUNCTUATION_RE.sub(" ", text.lower())
    return _WHITESPACE_RE.sub(" ", folded).strip()


def title_matches_card_name(title: str, card_name: str) -> bool:
    """
    Require the card's actual name to appear (punctuation/case-insensitive)
    in the listing title — not just eBay's own search relevance.

    Found live, not hypothetical: eBay's Browse API `q` search does loose
    keyword matching, not exact-phrase matching. A search for "ten thousand
    dragon yugioh" returned, among genuine copies, a completely different
    card — "Manju of the Ten Thousand Hands" — at 1% of the real card's
    price, because it shares two of three search words. Without this check,
    that reads as a 99%-off deal instead of the wrong card entirely.
    """
    if not card_name.strip():
        return True
    return _normalize_for_match(card_name) in _normalize_for_match(title)


def title_matches_printing(title: str, card_number: str | None) -> bool:
    """
    When the watchlist row has a card_number, require it (or its numerator,
    since sellers write "5/62" but Pokemon's own catalog sometimes just
    "5") to appear in the title too.

    Found live: a card_name-only check isn't enough for common creature
    names reprinted many times across a game's history. Searching "Gengar"
    against a row tracking the £171 1999 Fossil Gengar (5/62) matched, and
    passed the name check, a totally different modern reprint ("Gengar
    050/088 130 HP") at £2.23 — the "130 HP" alone marks it as a modern
    card the 1999 print never had. Without this, that reads as a 98%-off
    deal instead of the wrong printing entirely. Only applies when
    card_number is set — YGOPRODeck-priced rows have none (see README) and
    always pass.
    """
    if not card_number or not card_number.strip():
        return True
    numerator = card_number.split("/", 1)[0].strip()
    normalized_title = _normalize_for_match(title)

    if _normalize_for_match(card_number) in normalized_title:
        return True
    # The numerator alone (e.g. "5") needs a digit-boundary check, not a
    # plain substring one -- otherwise "5" matches inside "050" or "130"
    # (exactly how the real 050/088 false positive above got through on a
    # first pass). (?<!\d)...(?!\d) requires it not be glued to other digits.
    return bool(re.search(rf"(?<!\d){re.escape(_normalize_for_match(numerator))}(?!\d)", normalized_title))


# Keyword -> normalized condition label, checked in this order (most
# specific/important first) against the title. eBay's own structured
# `condition` field is useless for trading cards -- almost every listing is
# "Ungraded" regardless of the card's actual physical grade -- so the title
# is the only real signal, and only when a seller bothers to state it.
_CONDITION_KEYWORDS: list[tuple[str, str]] = [
    ("psa", "graded"),
    ("bgs", "graded"),
    ("cgc", "graded"),
    ("ace grading", "graded"),
    ("graded", "graded"),
    ("damaged", "damaged"),
    ("dmg", "damaged"),
    ("poor", "damaged"),
    ("heavily played", "heavily played"),
    (" hp ", "heavily played"),  # spaced to avoid matching "hp" inside "50 hp" etc.
    ("moderately played", "moderately played"),
    ("mp+", "moderately played"),
    (" mp ", "moderately played"),
    ("lightly played", "lightly played"),
    ("lp+", "lightly played"),
    (" lp ", "lightly played"),
    ("light wear", "lightly played"),
    ("near mint", "near mint"),
    (" nm ", "near mint"),
    ("mint", "near mint"),
    ("excellent", "excellent"),
]


def guess_condition_hint(title: str) -> str:
    """
    Best-effort condition read from the title text — never authoritative,
    just enough to stop a bare discount % from hiding "this is a heavily
    played copy" or "this is a professionally graded slab" (a different
    market entirely) behind an eye-catching percentage. Returns "not
    stated" when nothing recognizable is found, which is itself useful
    information -- treat an unstated condition as a reason to look closer,
    not as "presumably fine."
    """
    padded = f" {title.lower()} "
    for keyword, label in _CONDITION_KEYWORDS:
        if keyword in padded:
            return label
    return "not stated"


def minutes_remaining(item_end_date: datetime, now: datetime | None = None) -> Decimal:
    now = now or datetime.now(timezone.utc)
    delta = item_end_date - now
    return Decimal(delta.total_seconds()) / Decimal("60")


def evaluate_listing(
    listing: EbayListing,
    watchlist_item: WatchlistItem,
    market_price_gbp: Decimal,
    *,
    auction_window_minutes: int,
    auction_max_bid_count: int,
    now: datetime | None = None,
    fee_rate: Decimal = Decimal("0.13"),
    resale_postage: Decimal = Decimal("3.00"),
) -> MatchResult | None:
    """
    Return a MatchResult if this listing clears the deal bar for this
    watchlist rule, else None.

    Buy It Now: listed (price + postage) at or below the cap, any time.
    Auction: ends within `auction_window_minutes`, bid count within
    `auction_max_bid_count`, and the current bid + postage is at or below
    the cap.

    fee_rate/resale_postage feed the net-of-fees estimate on the result —
    purely informational, they never affect whether this counts as a match
    (that's still the gross, threshold-based cap). Defaults here match
    config.py's so callers that don't care about this still get a sane
    estimate rather than zero.
    """
    if title_is_excluded(listing.title, watchlist_item.exclude_terms_list):
        return None
    if not title_matches_card_name(listing.title, watchlist_item.card_name):
        return None
    if not title_matches_printing(listing.title, watchlist_item.card_number):
        return None

    cap = max_bid(market_price_gbp, watchlist_item.discount_threshold)
    total_price = listing.total_price

    if listing.listing_type == ListingType.BUY_IT_NOW:
        if total_price > cap:
            return None
    elif listing.listing_type == ListingType.AUCTION:
        if listing.bid_count is None or listing.bid_count > auction_max_bid_count:
            return None
        if listing.item_end_date is None:
            return None
        remaining = minutes_remaining(listing.item_end_date, now=now)
        if remaining < 0 or remaining > auction_window_minutes:
            return None
        if total_price > cap:
            return None
    else:  # pragma: no cover - defensive, ListingType is exhaustive today
        return None

    return MatchResult(
        listing=listing,
        watchlist_item=watchlist_item,
        market_price_gbp=market_price_gbp,
        max_bid_gbp=cap,
        discount_pct=discount_percentage(total_price, market_price_gbp),
        condition_hint=guess_condition_hint(listing.title),
        estimated_net_profit_gbp=estimate_net_profit(total_price, market_price_gbp, fee_rate, resale_postage),
        net_breakeven_cap_gbp=net_breakeven_cap(market_price_gbp, fee_rate, resale_postage),
    )
