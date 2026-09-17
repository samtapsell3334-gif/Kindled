import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from kestrel.config import Config
from kestrel.models import EbayListing, ListingType, MatchResult, PriceSource, Tier, WatchlistItem
from kestrel.telegram_client import is_configured, send_alert

NOW = datetime(2026, 9, 14, 20, 0, 0, tzinfo=timezone.utc)


class FakeResponse:
    def __init__(self, status_code=200, text="{}"):
        self.status_code = status_code
        self.text = text


class FakeSession:
    def __init__(self, response=None, raise_exc=None):
        self._response = response or FakeResponse(200)
        self._raise = raise_exc
        self.calls = []

    def post(self, url, **kwargs):
        if self._raise:
            raise self._raise
        self.calls.append((url, kwargs))
        return self._response


def make_config(**overrides) -> Config:
    base = dict(telegram_bot_token="test-token", telegram_chat_id="12345")
    base.update(overrides)
    return Config(**base)


def make_match(listing_type=ListingType.BUY_IT_NOW, image_url="https://img/1.jpg") -> MatchResult:
    item = WatchlistItem(
        id=1, game="pokemon", card_name="Charizard", set_name="Base", card_number="4",
        price_source=PriceSource.API, manual_market_price=None,
        discount_threshold=Decimal("0.40"), search_terms="charizard", exclude_terms="",
        tier=Tier.HOT, active=True, last_polled_at=None,
    )
    listing = EbayListing(
        item_id="v1|123|0", title="Charizard Base 4/102", listing_type=listing_type,
        item_price=Decimal("110.39") if listing_type == ListingType.BUY_IT_NOW else Decimal("0"),
        shipping_price=Decimal("2.99"), item_web_url="https://www.ebay.co.uk/itm/123",
        image_url=image_url,
        current_bid_price=Decimal("110.39") if listing_type == ListingType.AUCTION else None,
        bid_count=1 if listing_type == ListingType.AUCTION else None,
        item_end_date=NOW + timedelta(minutes=5) if listing_type == ListingType.AUCTION else None,
    )
    return MatchResult(
        listing=listing, watchlist_item=item, market_price_gbp=Decimal("197.30"),
        max_bid_gbp=Decimal("118.38"), discount_pct=Decimal("42.53"),
    )


class TestIsConfigured:
    def test_true_when_both_set(self):
        assert is_configured(make_config()) is True

    def test_false_when_token_missing(self):
        assert is_configured(make_config(telegram_bot_token=None)) is False

    def test_false_when_chat_id_missing(self):
        assert is_configured(make_config(telegram_chat_id=None)) is False


class TestSendAlert:
    def test_skips_silently_when_not_configured(self):
        session = FakeSession()
        result = send_alert(make_config(telegram_bot_token=None), make_match(), session)
        assert result is False
        assert session.calls == []

    def test_sends_photo_when_image_present(self):
        session = FakeSession()
        result = send_alert(make_config(), make_match(image_url="https://img/1.jpg"), session)
        assert result is True
        url, kwargs = session.calls[0]
        assert url.endswith("/sendPhoto")
        assert kwargs["data"]["photo"] == "https://img/1.jpg"

    def test_sends_text_message_when_no_image(self):
        session = FakeSession()
        result = send_alert(make_config(), make_match(image_url=None), session)
        assert result is True
        url, kwargs = session.calls[0]
        assert url.endswith("/sendMessage")

    def test_falls_back_to_text_message_when_caption_too_long(self):
        # Real failure this guards against: Telegram's sendPhoto caption
        # caps at 1024 chars (sendMessage allows 4096) -- a real alert with
        # Make Offer/price confidence/seller feedback lines plus a long
        # condition string got a live 400 "message caption is too long"
        # once those fields were added. An image_url is present here, so
        # without the length check this would wrongly try sendPhoto.
        match = make_match(image_url="https://img/1.jpg")
        match.condition_hint = "x" * 1100
        session = FakeSession()
        result = send_alert(make_config(), match, session)
        assert result is True
        url, kwargs = session.calls[0]
        assert url.endswith("/sendMessage")
        assert "x" * 1100 in kwargs["data"]["text"]

    def test_message_includes_card_name_price_and_discount(self):
        session = FakeSession()
        send_alert(make_config(), make_match(image_url=None), session)
        _, kwargs = session.calls[0]
        text = kwargs["data"]["text"]
        assert "Charizard" in text
        assert "113.38" in text
        assert "42.53" in text

    def test_auction_message_includes_max_bid_for_sniping(self):
        session = FakeSession()
        send_alert(make_config(), make_match(listing_type=ListingType.AUCTION, image_url=None), session)
        _, kwargs = session.calls[0]
        text = kwargs["data"]["text"]
        assert "118.38" in text  # the max bid, copyable into a sniper
        assert "bids" in text

    def test_buy_button_links_to_the_real_listing(self):
        session = FakeSession()
        send_alert(make_config(), make_match(image_url=None), session)
        _, kwargs = session.calls[0]
        markup = json.loads(kwargs["data"]["reply_markup"])
        button = markup["inline_keyboard"][0][0]
        assert button["url"] == "https://www.ebay.co.uk/itm/123"

    def test_returns_false_on_non_200(self):
        session = FakeSession(response=FakeResponse(400, '{"description":"bad request"}'))
        result = send_alert(make_config(), make_match(image_url=None), session)
        assert result is False

    def test_returns_false_on_network_error_not_raise(self):
        import requests

        session = FakeSession(raise_exc=requests.exceptions.ConnectionError("no route"))
        result = send_alert(make_config(), make_match(image_url=None), session)
        assert result is False

    def test_card_name_is_html_escaped(self):
        session = FakeSession()
        item = WatchlistItem(
            id=1, game="pokemon", card_name="Mew <script> & Co", set_name=None, card_number=None,
            price_source=PriceSource.API, manual_market_price=None,
            discount_threshold=Decimal("0.40"), search_terms="x", exclude_terms="",
            tier=Tier.STANDARD, active=True, last_polled_at=None,
        )
        match = make_match(image_url=None)
        match.watchlist_item = item
        send_alert(make_config(), match, session)
        _, kwargs = session.calls[0]
        assert "<script>" not in kwargs["data"]["text"]
        assert "&lt;script&gt;" in kwargs["data"]["text"]
