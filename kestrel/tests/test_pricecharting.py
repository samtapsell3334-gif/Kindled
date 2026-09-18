"""
kestrel.pricing.pricecharting -- a real-sold-comp cross-check via
PriceCharting.com, added after catching pokemontcg.io's cardmarket feed
badly wrong on 6 different cards across two independent pricing pipelines
(pokemon.py's own cardmarket-vs-tcgplayer check catches some of these, but
not when both of ITS sources happen to agree on a bad number -- confirmed
live for Raichu, Meowth, Dragonair, and Change of Heart, none of which the
existing sanity check could have caught since neither disagreed with
itself). See kestrel/pricing/pricecharting.py's module docstring for the
full story, including why eBay's own sold-comp API isn't usable here.
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from kestrel.pricing.pricecharting import (
    _console_slug,
    _numerator,
    fetch_ungraded_price_gbp,
    resolve_card_slug,
)


class FakeResponse:
    def __init__(self, status_code=200, text=""):
        self.status_code = status_code
        self.text = text


class FakeSession:
    def __init__(self, responses_by_url: dict[str, FakeResponse]):
        self._responses = responses_by_url
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append(url)
        return self._responses.get(url, FakeResponse(404, ""))


CONSOLE_HTML = '''
<table><tr>
<td><a href="/game/pokemon-neo-destiny/shining-tyranitar-113">Shining Tyranitar</a></td>
<td><a href="/game/pokemon-neo-destiny/shining-tyranitar-1st-edition-113">Shining Tyranitar (1st Ed)</a></td>
<td><a href="/game/pokemon-neo-destiny/dark-tyranitar-11">Dark Tyranitar</a></td>
</tr></table>
'''

CARD_HTML = '''
<table id="price_data">
<tbody><tr>
<td id="used_price"><span class="price js-price">
$100.00
</span></td>
</tr></tbody></table>
'''


class TestSlugMapping:
    def test_known_pokemon_set_maps_to_its_console_slug(self):
        assert _console_slug("pokemon", "Neo Destiny") == "pokemon-neo-destiny"

    def test_set_name_matching_is_case_insensitive(self):
        assert _console_slug("pokemon", "neo destiny") == "pokemon-neo-destiny"

    def test_unmapped_set_returns_none(self):
        assert _console_slug("pokemon", "Some Set We've Never Seen") is None

    def test_yugioh_set_uses_the_yugioh_table(self):
        assert _console_slug("yugioh", "Metal Raiders") == "yugioh-metal-raiders"


class TestNumerator:
    def test_pokemon_collector_number_takes_the_numerator(self):
        assert _numerator("113/105") == "113"

    def test_yugioh_set_code_has_no_slash_and_is_lowercased(self):
        assert _numerator("MRD-060") == "mrd-060"

    def test_none_input_returns_none(self):
        assert _numerator(None) is None


class TestResolveCardSlug:
    def test_finds_the_plain_printing_by_number_and_name(self):
        session = FakeSession({
            "https://www.pricecharting.com/console/pokemon-neo-destiny": FakeResponse(200, CONSOLE_HTML)
        })
        slug = resolve_card_slug(session, "pokemon", "Neo Destiny", "Shining Tyranitar", "113/105")
        assert slug == "shining-tyranitar-113"

    def test_unmapped_set_returns_none_without_a_request(self):
        session = FakeSession({})
        slug = resolve_card_slug(session, "pokemon", "Unknown Set", "Card", "1/1")
        assert slug is None
        assert session.calls == []

    def test_console_page_fetch_failure_returns_none(self):
        session = FakeSession({
            "https://www.pricecharting.com/console/pokemon-neo-destiny": FakeResponse(500, "")
        })
        slug = resolve_card_slug(session, "pokemon", "Neo Destiny", "Shining Tyranitar", "113/105")
        assert slug is None

    def test_number_with_no_matching_card_on_the_set_page_returns_none(self):
        session = FakeSession({
            "https://www.pricecharting.com/console/pokemon-neo-destiny": FakeResponse(200, CONSOLE_HTML)
        })
        slug = resolve_card_slug(session, "pokemon", "Neo Destiny", "Nonexistent Card", "999/105")
        assert slug is None


class TestFetchUngradedPriceGbp:
    def test_full_resolution_and_price_extraction(self, monkeypatch):
        monkeypatch.setattr("kestrel.pricing.pricecharting.time.sleep", lambda *_: None)
        session = FakeSession({
            "https://www.pricecharting.com/console/pokemon-neo-destiny": FakeResponse(200, CONSOLE_HTML),
            "https://www.pricecharting.com/game/pokemon-neo-destiny/shining-tyranitar-113": FakeResponse(200, CARD_HTML),
        })
        price = fetch_ungraded_price_gbp(
            session, Decimal("0.79"), "pokemon", "Neo Destiny", "Shining Tyranitar", "113/105"
        )
        assert price == Decimal("79.00")  # 100.00 * 0.79

    def test_unresolvable_card_returns_none(self, monkeypatch):
        monkeypatch.setattr("kestrel.pricing.pricecharting.time.sleep", lambda *_: None)
        session = FakeSession({})
        price = fetch_ungraded_price_gbp(session, Decimal("0.79"), "pokemon", "Unmapped Set", "Card", "1/1")
        assert price is None

    def test_card_page_with_no_used_price_field_returns_none(self, monkeypatch):
        monkeypatch.setattr("kestrel.pricing.pricecharting.time.sleep", lambda *_: None)
        session = FakeSession({
            "https://www.pricecharting.com/console/pokemon-neo-destiny": FakeResponse(200, CONSOLE_HTML),
            "https://www.pricecharting.com/game/pokemon-neo-destiny/shining-tyranitar-113": FakeResponse(200, "<html>no price table</html>"),
        })
        price = fetch_ungraded_price_gbp(
            session, Decimal("0.79"), "pokemon", "Neo Destiny", "Shining Tyranitar", "113/105"
        )
        assert price is None
