from decimal import Decimal

import pytest

from kestrel.db import get_connection, init_db
from kestrel.models import PriceSource, Tier
from kestrel.watchlist import (
    add_item,
    delete_item,
    get_item,
    list_items,
    mark_polled,
    set_active,
    set_discount_threshold,
    set_exclude_terms,
    set_manual_market_price,
)


@pytest.fixture()
def conn(tmp_path):
    db_path = tmp_path / "test.db"
    init_db(db_path)
    with get_connection(db_path) as c:
        yield c


def test_add_and_get_api_row(conn):
    item_id = add_item(
        conn,
        game="pokemon",
        card_name="Charizard",
        set_name="Base Set",
        card_number="4/102",
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="charizard base set",
        exclude_terms="proxy,lot",
        tier=Tier.HOT,
    )
    item = get_item(conn, item_id)
    assert item is not None
    assert item.card_name == "Charizard"
    assert item.price_source == PriceSource.API
    assert item.manual_market_price is None
    assert item.tier == Tier.HOT
    assert item.active is True


def test_add_manual_row_requires_manual_price(conn):
    with pytest.raises(ValueError):
        add_item(
            conn,
            game="football",
            card_name="Some Topps Card",
            set_name=None,
            card_number=None,
            price_source=PriceSource.MANUAL,
            manual_market_price=None,
            discount_threshold=Decimal("0.40"),
            search_terms="topps card",
            exclude_terms="",
            tier=Tier.STANDARD,
        )


def test_add_api_row_rejects_manual_price(conn):
    with pytest.raises(ValueError):
        add_item(
            conn,
            game="pokemon",
            card_name="Charizard",
            set_name=None,
            card_number=None,
            price_source=PriceSource.API,
            manual_market_price=Decimal("10.00"),
            discount_threshold=Decimal("0.40"),
            search_terms="charizard",
            exclude_terms="",
            tier=Tier.STANDARD,
        )


def test_disable_and_enable_round_trip(conn):
    item_id = add_item(
        conn,
        game="pokemon",
        card_name="Pikachu",
        set_name=None,
        card_number=None,
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="pikachu",
        exclude_terms="",
        tier=Tier.STANDARD,
    )
    set_active(conn, item_id, False)
    assert get_item(conn, item_id).active is False
    assert list_items(conn, active_only=True) == []

    set_active(conn, item_id, True)
    assert get_item(conn, item_id).active is True


def test_delete_item(conn):
    item_id = add_item(
        conn,
        game="pokemon",
        card_name="Pikachu",
        set_name=None,
        card_number=None,
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="pikachu",
        exclude_terms="",
        tier=Tier.STANDARD,
    )
    delete_item(conn, item_id)
    assert get_item(conn, item_id) is None


def test_mark_polled_updates_last_polled_at(conn):
    item_id = add_item(
        conn,
        game="pokemon",
        card_name="Pikachu",
        set_name=None,
        card_number=None,
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="pikachu",
        exclude_terms="",
        tier=Tier.STANDARD,
    )
    assert get_item(conn, item_id).last_polled_at is None
    mark_polled(conn, item_id)
    assert get_item(conn, item_id).last_polled_at is not None


def test_set_discount_threshold_updates_the_row(conn):
    item_id = add_item(
        conn,
        game="pokemon",
        card_name="Pikachu",
        set_name=None,
        card_number=None,
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="pikachu",
        exclude_terms="",
        tier=Tier.STANDARD,
    )
    set_discount_threshold(conn, item_id, Decimal("0.25"))
    assert get_item(conn, item_id).discount_threshold == Decimal("0.25")


def test_set_discount_threshold_rejects_out_of_range(conn):
    item_id = add_item(
        conn,
        game="pokemon",
        card_name="Pikachu",
        set_name=None,
        card_number=None,
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="pikachu",
        exclude_terms="",
        tier=Tier.STANDARD,
    )
    with pytest.raises(ValueError):
        set_discount_threshold(conn, item_id, Decimal("1.5"))
    with pytest.raises(ValueError):
        set_discount_threshold(conn, item_id, Decimal("-0.1"))


def test_set_manual_market_price_updates_the_row(conn):
    item_id = add_item(
        conn,
        game="football",
        card_name="Some Topps Card",
        set_name=None,
        card_number=None,
        price_source=PriceSource.MANUAL,
        manual_market_price=Decimal("10.00"),
        discount_threshold=Decimal("0.40"),
        search_terms="topps card",
        exclude_terms="",
        tier=Tier.STANDARD,
    )
    set_manual_market_price(conn, item_id, Decimal("15.50"))
    assert get_item(conn, item_id).manual_market_price == Decimal("15.50")


def test_set_exclude_terms_updates_the_row(conn):
    item_id = add_item(
        conn,
        game="pokemon",
        card_name="Pikachu",
        set_name=None,
        card_number=None,
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="pikachu",
        exclude_terms="proxy",
        tier=Tier.STANDARD,
    )
    set_exclude_terms(conn, item_id, "proxy,custom,french,german")
    assert get_item(conn, item_id).exclude_terms == "proxy,custom,french,german"
