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
