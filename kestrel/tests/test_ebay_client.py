from datetime import datetime, timezone
from decimal import Decimal

import pytest

from kestrel.config import Config
from kestrel.ebay_client import EbayApiError, EbayClient, normalize_item
from kestrel.models import ListingType

NOW = datetime(2026, 9, 14, 20, 0, 0, tzinfo=timezone.utc)


class FakeResponse:
    def __init__(self, status_code, json_body=None, text="", headers=None):
        self.status_code = status_code
        self._json = json_body or {}
        self.text = text
        self.headers = headers or {}

    def json(self):
        return self._json


class FakeSession:
    """Records every call; returns canned responses in order per-method."""

    def __init__(self, get_responses=None, post_responses=None):
        self.get_responses = list(get_responses or [])
        self.post_responses = list(post_responses or [FakeResponse(200, {"access_token": "tok-1", "expires_in": 7200})])
        self.get_calls = []
        self.post_calls = []
        self.sleep_calls = []

    def post(self, url, **kwargs):
        self.post_calls.append((url, kwargs))
        return self.post_responses.pop(0)

    def get(self, url, **kwargs):
        self.get_calls.append((url, kwargs))
        return self.get_responses.pop(0)


def make_config(**overrides) -> Config:
    base = dict(
        ebay_env="sandbox",
        ebay_client_id="id",
        ebay_client_secret="secret",
        ebay_marketplace_id="EBAY_GB",
        ebay_max_retries=3,
        ebay_backoff_base_seconds=0.0,  # keep tests fast
    )
    base.update(overrides)
    return Config(**base)


SEARCH_BODY = {
    "itemSummaries": [
        {
            "itemId": "v1|123|0",
            "title": "Charizard Base Set 4/102",
            "buyingOptions": ["FIXED_PRICE"],
            "price": {"value": "50.00", "currency": "GBP"},
            "shippingOptions": [{"shippingCost": {"value": "3.00", "currency": "GBP"}}],
            "itemWebUrl": "https://ebay.co.uk/itm/123",
            "image": {"imageUrl": "https://img/123.jpg"},
        }
    ]
}


class TestTokenCaching:
    def test_token_reused_across_two_searches(self, monkeypatch):
        import kestrel.ebay_client as ebay_mod

        monkeypatch.setattr(ebay_mod.time, "sleep", lambda s: None)
        session = FakeSession(get_responses=[FakeResponse(200, SEARCH_BODY), FakeResponse(200, SEARCH_BODY)])
        client = EbayClient(make_config(), session)

        client.search_buy_it_now("charizard")
        client.search_buy_it_now("charizard")

        assert len(session.post_calls) == 1  # token fetched once, reused


class TestBackoff:
    def test_retries_on_429_then_succeeds(self, monkeypatch):
        import kestrel.ebay_client as ebay_mod

        sleeps = []
        monkeypatch.setattr(ebay_mod.time, "sleep", lambda s: sleeps.append(s))
        session = FakeSession(
            get_responses=[
                FakeResponse(429, text="rate limited", headers={}),
                FakeResponse(200, SEARCH_BODY),
            ]
        )
        client = EbayClient(make_config(), session)
        listings = client.search_buy_it_now("charizard")

        assert len(listings) == 1
        assert len(sleeps) == 1  # backed off exactly once before succeeding

    def test_raises_after_exhausting_retries(self, monkeypatch):
        import kestrel.ebay_client as ebay_mod

        monkeypatch.setattr(ebay_mod.time, "sleep", lambda s: None)
        session = FakeSession(get_responses=[FakeResponse(429, text="rate limited")] * 4)
        client = EbayClient(make_config(ebay_max_retries=3), session)

        with pytest.raises(EbayApiError):
            client.search_buy_it_now("charizard")

    def test_does_not_retry_on_4xx_auth_error(self):
        session = FakeSession(get_responses=[FakeResponse(403, text="forbidden")])
        client = EbayClient(make_config(), session)

        with pytest.raises(EbayApiError):
            client.search_buy_it_now("charizard")
        assert len(session.get_calls) == 1  # no retry attempted


class TestFilterBuilding:
    def test_auction_search_filters_buying_option_bid_count_and_end_date_range(self):
        session = FakeSession(get_responses=[FakeResponse(200, {"itemSummaries": []})])
        client = EbayClient(make_config(), session)

        client.search_auctions("charizard", window_minutes=10, max_bid_count=2, now=NOW)

        _, kwargs = session.get_calls[0]
        filter_value = kwargs["params"]["filter"]
        assert "buyingOptions:{AUCTION}" in filter_value
        assert "bidCount:[0..2]" in filter_value
        # End-only range, no lower bound (see ebay_client.search_auctions for
        # why: eBay rejects a range whose start isn't strictly in the future,
        # errorId 12002 — confirmed against the real production API).
        assert "itemEndDate:[..2026-09-14T20:10:00Z]" in filter_value

    def test_auction_search_end_date_has_no_lower_bound(self):
        """Regression test: an itemEndDate range starting at "now" is silently
        rejected by the real eBay API (errorId 12002) and the whole filter
        gets dropped -- found by testing against production, not a guess."""
        session = FakeSession(get_responses=[FakeResponse(200, {"itemSummaries": []})])
        client = EbayClient(make_config(), session)

        client.search_auctions("charizard", window_minutes=10, max_bid_count=2, now=NOW)

        _, kwargs = session.get_calls[0]
        filter_value = kwargs["params"]["filter"]
        assert "itemEndDate:[.." in filter_value
        assert "2026-09-14T20:00:00" not in filter_value  # the old (now) lower bound must be gone

    def test_buy_it_now_search_filters_fixed_price_only(self):
        session = FakeSession(get_responses=[FakeResponse(200, {"itemSummaries": []})])
        client = EbayClient(make_config(), session)

        client.search_buy_it_now("charizard")

        _, kwargs = session.get_calls[0]
        assert kwargs["params"]["filter"] == "buyingOptions:{FIXED_PRICE}"

    def test_marketplace_header_is_set(self):
        session = FakeSession(get_responses=[FakeResponse(200, {"itemSummaries": []})])
        client = EbayClient(make_config(ebay_marketplace_id="EBAY_GB"), session)

        client.search_buy_it_now("charizard")

        _, kwargs = session.get_calls[0]
        assert kwargs["headers"]["X-EBAY-C-MARKETPLACE-ID"] == "EBAY_GB"


class TestNormalizeItem:
    def test_buy_it_now_item(self):
        listing = normalize_item(SEARCH_BODY["itemSummaries"][0])
        assert listing.listing_type == ListingType.BUY_IT_NOW
        assert listing.item_price == pytest.approx(50.0)  # Decimal compares fine with approx via float cast in message only
        assert listing.shipping_price == pytest.approx(3.0)
        assert listing.total_price == 53

    def test_auction_item_uses_current_bid(self):
        raw = {
            "itemId": "v1|456|0",
            "title": "Charizard Auction",
            "buyingOptions": ["AUCTION"],
            "price": {"value": "0", "currency": "GBP"},
            "currentBidPrice": {"value": "40.00", "currency": "GBP"},
            "bidCount": 1,
            "itemEndDate": "2026-09-14T20:05:00.000Z",
            "shippingOptions": [{"shippingCost": {"value": "3.00", "currency": "GBP"}}],
            "itemWebUrl": "https://ebay.co.uk/itm/456",
        }
        listing = normalize_item(raw)
        assert listing.listing_type == ListingType.AUCTION
        assert listing.bid_count == 1
        assert listing.total_price == 43
        assert listing.item_end_date == datetime(2026, 9, 14, 20, 5, 0, tzinfo=timezone.utc)

    def test_best_offer_buying_option_is_captured(self):
        raw = {
            "itemId": "v1|789|0",
            "title": "Charizard BIN with Offer",
            "buyingOptions": ["FIXED_PRICE", "BEST_OFFER"],
            "price": {"value": "50.00", "currency": "GBP"},
            "itemWebUrl": "https://ebay.co.uk/itm/789",
        }
        listing = normalize_item(raw)
        assert listing.accepts_best_offer is True

    def test_no_best_offer_option_defaults_false(self):
        listing = normalize_item(SEARCH_BODY["itemSummaries"][0])
        assert listing.accepts_best_offer is False

    def test_seller_feedback_is_captured(self):
        raw = {
            "itemId": "v1|999|0",
            "title": "Charizard with seller info",
            "buyingOptions": ["FIXED_PRICE"],
            "price": {"value": "50.00", "currency": "GBP"},
            "itemWebUrl": "https://ebay.co.uk/itm/999",
            "seller": {"username": "cardshop99", "feedbackScore": 4200, "feedbackPercentage": "99.6"},
        }
        listing = normalize_item(raw)
        assert listing.seller_username == "cardshop99"
        assert listing.seller_feedback_score == 4200
        assert listing.seller_feedback_pct == Decimal("99.6")

    def test_zero_feedback_seller_is_captured_not_dropped(self):
        # A real red flag (brand-new/no-history seller) must survive
        # normalization, not look the same as "no seller data at all".
        raw = {
            "itemId": "v1|998|0",
            "title": "Charizard from a new seller",
            "buyingOptions": ["FIXED_PRICE"],
            "price": {"value": "50.00", "currency": "GBP"},
            "itemWebUrl": "https://ebay.co.uk/itm/998",
            "seller": {"username": "nimattin-0", "feedbackScore": 0, "feedbackPercentage": "0.0"},
        }
        listing = normalize_item(raw)
        assert listing.seller_feedback_score == 0
        assert listing.seller_feedback_pct == Decimal("0.0")

    def test_missing_seller_block_defaults_to_none(self):
        raw = {
            "itemId": "v1|997|0",
            "title": "Charizard no seller block",
            "buyingOptions": ["FIXED_PRICE"],
            "price": {"value": "50.00", "currency": "GBP"},
            "itemWebUrl": "https://ebay.co.uk/itm/997",
        }
        listing = normalize_item(raw)
        assert listing.seller_username is None
        assert listing.seller_feedback_score is None
        assert listing.seller_feedback_pct is None


class TestGetItemConditionDetail:
    """Real, structured signal confirmed against production: the item
    detail endpoint's conditionDescriptors -> "Card Condition" field carries
    seller-declared values ("Heavily played (Poor)") plus specific defect
    notes, that eBay's search summary never returns."""

    def test_extracts_condition_and_joins_additional_info(self):
        body = {
            "conditionDescriptors": [
                {
                    "name": "Card Condition",
                    "values": [
                        {
                            "content": "Heavily played (Poor)",
                            "additionalInfo": ["Major creasing", "Heavily worn and rounded corners"],
                        }
                    ],
                }
            ]
        }
        session = FakeSession(get_responses=[FakeResponse(200, body)])
        client = EbayClient(make_config(), session)

        result = client.get_item_condition_detail("v1|123|0")

        assert result == "Heavily played (Poor) — Major creasing, Heavily worn and rounded corners"

    def test_returns_bare_content_when_no_additional_info(self):
        body = {"conditionDescriptors": [{"name": "Card Condition", "values": [{"content": "Near mint or better"}]}]}
        session = FakeSession(get_responses=[FakeResponse(200, body)])
        client = EbayClient(make_config(), session)

        assert client.get_item_condition_detail("v1|123|0") == "Near mint or better"

    def test_returns_none_when_no_card_condition_descriptor(self):
        body = {"conditionDescriptors": [{"name": "Something Else", "values": [{"content": "irrelevant"}]}]}
        session = FakeSession(get_responses=[FakeResponse(200, body)])
        client = EbayClient(make_config(), session)

        assert client.get_item_condition_detail("v1|123|0") is None

    def test_returns_none_when_descriptors_missing_entirely(self):
        session = FakeSession(get_responses=[FakeResponse(200, {})])
        client = EbayClient(make_config(), session)

        assert client.get_item_condition_detail("v1|123|0") is None

    def test_returns_none_on_failure_never_raises(self):
        session = FakeSession(get_responses=[FakeResponse(404, text="not found")])
        client = EbayClient(make_config(ebay_max_retries=0), session)

        assert client.get_item_condition_detail("v1|123|0") is None

    def test_item_id_is_url_encoded_in_the_request_path(self):
        session = FakeSession(get_responses=[FakeResponse(200, {})])
        client = EbayClient(make_config(), session)

        client.get_item_condition_detail("v1|307183747642|0")

        url, _ = session.get_calls[0]
        assert "v1%7C307183747642%7C0" in url
        assert "|" not in url
