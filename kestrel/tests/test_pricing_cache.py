from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from kestrel.db import get_connection, init_db
from kestrel.pricing.cache import get_cached_price, get_last_price_any_age, normalize_cache_key, set_cached_price


@pytest.fixture()
def conn(tmp_path):
    db_path = tmp_path / "test.db"
    init_db(db_path)
    with get_connection(db_path) as c:
        yield c


def test_normalize_cache_key_is_case_and_whitespace_insensitive():
    a = normalize_cache_key("Pokemon", " Base Set ", "4/102", "Charizard")
    b = normalize_cache_key("pokemon", "base set", "4/102", "charizard")
    assert a == b


def test_cache_miss_returns_none(conn):
    assert get_cached_price(conn, "missing-key", cache_hours=12) is None


def test_cache_hit_within_window(conn):
    set_cached_price(conn, "k1", "pokemon", Decimal("12.34"), "pokemontcg.io")
    assert get_cached_price(conn, "k1", cache_hours=12) == Decimal("12.34")


def test_cache_expired_after_window(conn):
    stale = (datetime.now(timezone.utc) - timedelta(hours=13)).isoformat()
    conn.execute(
        "INSERT INTO price_cache (cache_key, game, market_price_gbp, source, fetched_at) VALUES (?, ?, ?, ?, ?)",
        ("k2", "pokemon", "9.99", "pokemontcg.io", stale),
    )
    conn.commit()
    assert get_cached_price(conn, "k2", cache_hours=12) is None


def test_set_cached_price_upserts(conn):
    set_cached_price(conn, "k3", "pokemon", Decimal("1.00"), "pokemontcg.io")
    set_cached_price(conn, "k3", "pokemon", Decimal("2.00"), "pokemontcg.io")
    assert get_cached_price(conn, "k3", cache_hours=12) == Decimal("2.00")


def test_get_last_price_any_age_ignores_ttl(conn):
    stale = (datetime.now(timezone.utc) - timedelta(hours=100)).isoformat()
    conn.execute(
        "INSERT INTO price_cache (cache_key, game, market_price_gbp, source, fetched_at) VALUES (?, ?, ?, ?, ?)",
        ("k4", "pokemon", "42.00", "pokemontcg.io", stale),
    )
    conn.commit()
    # get_cached_price would refuse this (100h > any reasonable TTL)...
    assert get_cached_price(conn, "k4", cache_hours=12) is None
    # ...but get_last_price_any_age still returns it, by design.
    assert get_last_price_any_age(conn, "k4") == Decimal("42.00")


def test_get_last_price_any_age_returns_none_when_never_cached(conn):
    assert get_last_price_any_age(conn, "never-seen-key") is None
