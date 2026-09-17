from decimal import Decimal

import pytest

from kestrel.config import Config
from kestrel.pricing import pokemon, yugioh


@pytest.fixture(autouse=True)
def _no_real_sleep(monkeypatch):
    # Both modules now retry through transient failures with a real
    # time.sleep backoff (see the real 500/502 flakiness this guards
    # against) -- monkeypatched here so the retry-exhaustion tests stay
    # fast rather than actually sleeping several seconds each.
    monkeypatch.setattr("kestrel.pricing.pokemon.time.sleep", lambda *_: None)
    monkeypatch.setattr("kestrel.pricing.yugioh.time.sleep", lambda *_: None)


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


class FakeSequentialSession:
    """Returns a different response on each successive call -- for testing
    retry behavior, where the first call(s) fail and a later one succeeds."""

    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return self._responses.pop(0)


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

    def test_retries_through_transient_failures_and_succeeds(self):
        # Real finding: pokemontcg.io returned 500/502 on 4 of 5 consecutive
        # live requests during a real poll cycle -- confirmed general
        # backend instability, not a daily quota 429. Without a retry, this
        # silently drops a row's price for the whole cycle.
        body = {"data": [{"cardmarket": {"prices": {"trendPrice": 100.0}}}]}
        session = FakeSequentialSession([FakeResponse(502), FakeResponse(500), FakeResponse(200, body)])
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Charizard", None, None)
        assert price == Decimal("85.00")
        assert len(session.calls) == 3

    def test_gives_up_after_max_retries(self):
        session = FakeSequentialSession([FakeResponse(502)] * 4)  # 1 initial + 3 retries
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Charizard", None, None)
        assert price is None
        assert len(session.calls) == 4

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


class TestPokemonTcgplayerFallback:
    """Regression coverage for a real finding: brand-new sets (checked live
    against the whole of Prismatic Evolutions and Surging Sparks) can have
    `cardmarket: null` entirely -- every card in the set would silently
    never price without a fallback to tcgplayer (USD)."""

    def test_falls_back_to_tcgplayer_when_cardmarket_is_null(self):
        body = {"data": [{
            "cardmarket": None,
            "tcgplayer": {"prices": {"holofoil": {"market": 12.50}}},
        }]}
        session = FakeSession(FakeResponse(200, body))
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Pinsir", "Prismatic Evolutions", None)
        assert price == Decimal("10.00")  # 12.50 * 0.80 (fx_usd_to_gbp)

    def test_cardmarket_present_and_nonzero_wins_over_tcgplayer(self):
        body = {"data": [{
            "cardmarket": {"prices": {"trendPrice": 100.0}},
            "tcgplayer": {"prices": {"holofoil": {"market": 999.0}}},
        }]}
        session = FakeSession(FakeResponse(200, body))
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Charizard", "Base", "4")
        assert price == Decimal("85.00")  # 100.0 * 0.85 (fx_eur_to_gbp), not the tcgplayer figure

    def test_prefers_holofoil_variant_over_normal(self):
        body = {"data": [{
            "cardmarket": None,
            "tcgplayer": {"prices": {"normal": {"market": 1.00}, "holofoil": {"market": 50.00}}},
        }]}
        session = FakeSession(FakeResponse(200, body))
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Pinsir", None, None)
        assert price == Decimal("40.00")  # 50.00 * 0.80, the holofoil variant

    def test_no_price_data_anywhere_returns_none(self):
        body = {"data": [{"cardmarket": None, "tcgplayer": None}]}
        session = FakeSession(FakeResponse(200, body))
        price = pokemon.fetch_market_price_gbp(session, make_config(), "Nonexistent", None, None)
        assert price is None


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

    def test_retries_through_transient_failures_and_succeeds(self):
        body = {"data": [{"card_prices": [{"cardmarket_price": "20.00", "tcgplayer_price": "30.00"}]}]}
        session = FakeSequentialSession([FakeResponse(502), FakeResponse(500), FakeResponse(200, body)])
        price = yugioh.fetch_market_price_gbp(session, make_config(), "Dark Magician")
        assert price == Decimal("17.00")
        assert len(session.calls) == 3

    def test_gives_up_after_max_retries(self):
        session = FakeSequentialSession([FakeResponse(502)] * 4)
        price = yugioh.fetch_market_price_gbp(session, make_config(), "Dark Magician")
        assert price is None
        assert len(session.calls) == 4


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
