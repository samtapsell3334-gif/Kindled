from decimal import Decimal

from kestrel.config import Config
from kestrel.pricing import pokemon, yugioh


class FakeResponse:
    def __init__(self, status_code=200, json_body=None):
        self.status_code = status_code
        self._json = json_body or {}

    def json(self):
        return self._json


class FakeSession:
    def __init__(self, response):
        self._response = response
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return self._response


def make_config(**overrides) -> Config:
    base = dict(fx_eur_to_gbp=Decimal("0.85"), fx_usd_to_gbp=Decimal("0.80"))
    base.update(overrides)
    return Config(**base)


class TestPokemonPricing:
    def test_uses_cardmarket_trend_price_converted_to_gbp(self):
        body = {"data": [{"cardmarket": {"prices": {"trendPrice": 100.0}}}]}
        session = FakeSession(FakeResponse(200, body))
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Charizard", "Base Set", "4/102")
        assert price == Decimal("85.00")

    def test_returns_none_when_no_cards_found(self):
        session = FakeSession(FakeResponse(200, {"data": []}))
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Nonexistent Card", None, None)
        assert price is None

    def test_returns_none_on_error_status(self):
        session = FakeSession(FakeResponse(500, {}))
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Charizard", None, None)
        assert price is None

    def test_query_includes_all_identity_fields(self):
        body = {"data": [{"cardmarket": {"prices": {"trendPrice": 10.0}}}]}
        session = FakeSession(FakeResponse(200, body))
        pokemon.fetch_market_price_gbp(session, make_config(), "Charizard", "Base Set", "4/102")
        _, kwargs = session.calls[0]
        q = kwargs["params"]["q"]
        assert 'name:"Charizard"' in q
        assert 'set.name:"Base Set"' in q
        assert 'number:"4"' in q  # pokemontcg.io stores the numerator only

    def test_card_number_without_slash_is_used_as_is(self):
        body = {"data": [{"cardmarket": {"prices": {"trendPrice": 10.0}}}]}
        session = FakeSession(FakeResponse(200, body))
        pokemon.fetch_market_price_gbp(session, make_config(), "Charizard", None, "4")
        _, kwargs = session.calls[0]
        assert 'number:"4"' in kwargs["params"]["q"]


class TestYugiohPricing:
    def test_prefers_cardmarket_price_over_tcgplayer(self):
        body = {"data": [{"card_prices": [{"cardmarket_price": "20.00", "tcgplayer_price": "30.00"}]}]}
        session = FakeSession(FakeResponse(200, body))
        price = yugioh.fetch_market_price_gbp(session, make_config(), "Dark Magician")
        assert price == Decimal("17.00")  # 20.00 * 0.85

    def test_falls_back_to_tcgplayer_usd_when_cardmarket_zero(self):
        body = {"data": [{"card_prices": [{"cardmarket_price": "0.00", "tcgplayer_price": "30.00"}]}]}
        session = FakeSession(FakeResponse(200, body))
        price = yugioh.fetch_market_price_gbp(session, make_config(), "Dark Magician")
        assert price == Decimal("24.00")  # 30.00 * 0.80

    def test_returns_none_when_no_cards_found(self):
        session = FakeSession(FakeResponse(200, {"data": []}))
        price = yugioh.fetch_market_price_gbp(session, make_config(), "Nonexistent Card")
        assert price is None


class TestYugiohSetSpecificPricing:
    """Regression coverage for a real finding: `card_prices` blends every
    printing a card has ever had into one figure — for a vintage card
    reprinted dozens of times since 2002, that collapses to the cheapest
    current reprint (~£0.14 for Red-Eyes Black Dragon), nowhere near a real
    first-print value (~£40 via the set-specific figure below). A watchlist
    row for a specific vintage printing must use `card_sets`, not
    `card_prices`."""

    def _card(self, card_sets):
        return {
            "card_prices": [{"cardmarket_price": "0.15", "tcgplayer_price": "0.23"}],
            "card_sets": card_sets,
        }

    def test_uses_set_specific_price_when_set_name_given(self):
        body = {"data": [self._card([
            {"set_name": "Legend of Blue Eyes White Dragon", "set_code": "LOB-070", "set_price": "39.69"},
        ])]}
        session = FakeSession(FakeResponse(200, body))
        price = yugioh.fetch_market_price_gbp(
            session, make_config(), "Red-Eyes Black Dragon", "Legend of Blue Eyes White Dragon", None
        )
        assert price == Decimal("31.75")  # 39.69 * 0.80 (fx_usd_to_gbp), not the £0.12ish generic price

    def test_exact_set_code_match_wins_over_ambiguous_variants(self):
        body = {"data": [self._card([
            {"set_name": "Legend of Blue Eyes White Dragon", "set_code": "LOB-070", "set_price": "39.69"},
            {"set_name": "Legend of Blue Eyes White Dragon", "set_code": "LOB-E056", "set_price": "920.45"},
        ])]}
        session = FakeSession(FakeResponse(200, body))
        price = yugioh.fetch_market_price_gbp(
            session, make_config(), "Red-Eyes Black Dragon", "Legend of Blue Eyes White Dragon", "LOB-070"
        )
        assert price == Decimal("31.75")  # picks the exact requested printing, not the pricier variant

    def test_prefers_plain_set_code_when_no_card_number_given(self):
        body = {"data": [self._card([
            {"set_name": "Legend of Blue Eyes White Dragon", "set_code": "LOB-EN070", "set_price": "0"},
            {"set_name": "Legend of Blue Eyes White Dragon", "set_code": "LOB-070", "set_price": "39.69"},
            {"set_name": "Legend of Blue Eyes White Dragon", "set_code": "LOB-E056", "set_price": "920.45"},
        ])]}
        session = FakeSession(FakeResponse(200, body))
        price = yugioh.fetch_market_price_gbp(
            session, make_config(), "Red-Eyes Black Dragon", "Legend of Blue Eyes White Dragon", None
        )
        assert price == Decimal("31.75")

    def test_falls_back_to_generic_price_when_set_name_not_found(self):
        body = {"data": [self._card([
            {"set_name": "Some Other Set", "set_code": "OTH-001", "set_price": "12.00"},
        ])]}
        session = FakeSession(FakeResponse(200, body))
        price = yugioh.fetch_market_price_gbp(
            session, make_config(), "Red-Eyes Black Dragon", "Legend of Blue Eyes White Dragon", None
        )
        assert price == Decimal("0.13")  # generic cardmarket_price(0.15) * 0.85 fallback, not a crash/None

    def test_no_set_name_given_uses_generic_price_unchanged(self):
        body = {"data": [self._card([
            {"set_name": "Legend of Blue Eyes White Dragon", "set_code": "LOB-070", "set_price": "39.69"},
        ])]}
        session = FakeSession(FakeResponse(200, body))
        price = yugioh.fetch_market_price_gbp(session, make_config(), "Red-Eyes Black Dragon")
        assert price == Decimal("0.13")  # backward-compatible: no set_name -> old behavior
