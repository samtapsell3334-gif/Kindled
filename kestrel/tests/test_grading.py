from decimal import Decimal

import pytest

from kestrel.db import get_connection, init_db
from kestrel.grading import detect_grade, get_graded_price, list_graded_prices, remove_graded_price, set_graded_price
from kestrel.models import DetectedGrade, PriceSource, Tier
from kestrel.watchlist import add_item


@pytest.fixture()
def conn(tmp_path):
    db_path = tmp_path / "test.db"
    init_db(db_path)
    with get_connection(db_path) as c:
        yield c


@pytest.fixture()
def watchlist_id(conn) -> int:
    return add_item(
        conn,
        game="pokemon",
        card_name="Blastoise",
        set_name="Base",
        card_number="2/102",
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.25"),
        search_terms="blastoise base",
        exclude_terms="",
        tier=Tier.STANDARD,
    )


class TestDetectGrade:
    @pytest.mark.parametrize(
        "text,company,grade",
        [
            ("PSA 9 Blastoise Base Set", "PSA", Decimal("9")),
            ("Blastoise PSA9 Holo", "PSA", Decimal("9")),
            ("Blastoise BGS 9.5 Base Set", "BGS", Decimal("9.5")),
            ("CGC 10 Pristine Charizard", "CGC", Decimal("10")),
            ("Pikachu SGC-8.5", "SGC", Decimal("8.5")),
            ("psa 10 gem mint", "PSA", Decimal("10")),
        ],
    )
    def test_detects_company_and_grade(self, text, company, grade):
        result = detect_grade(text)
        assert result == DetectedGrade(company=company, grade=grade)

    def test_no_grade_mention_returns_none(self):
        assert detect_grade("Blastoise Base Set 2/102 near mint ungraded") is None

    def test_bare_hp_stat_is_not_mistaken_for_a_grade(self):
        # "80 HP" on a card's own stat line must never look like a grading
        # company + number -- HP isn't in the company list, so this is
        # mostly a sanity check that the regex doesn't over-match.
        assert detect_grade("Blastoise 80 HP Base Set near mint") is None


class TestGradedPriceCrud:
    def test_set_then_get_roundtrips(self, conn, watchlist_id):
        set_graded_price(conn, watchlist_id, "psa", Decimal("9"), Decimal("120.00"))
        assert get_graded_price(conn, watchlist_id, "PSA", Decimal("9")) == Decimal("120.00")

    def test_get_missing_grade_returns_none(self, conn, watchlist_id):
        assert get_graded_price(conn, watchlist_id, "PSA", Decimal("9")) is None

    def test_lookup_is_indifferent_to_decimal_formatting(self, conn, watchlist_id):
        # Stored as "9" (canonical), looked up as Decimal("9.0") -- must
        # still match, since a grade written either way means the same card.
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("120.00"))
        assert get_graded_price(conn, watchlist_id, "PSA", Decimal("9.0")) == Decimal("120.00")

    def test_set_again_overwrites_existing_price(self, conn, watchlist_id):
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("120.00"))
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("135.00"))

        assert get_graded_price(conn, watchlist_id, "PSA", Decimal("9")) == Decimal("135.00")
        assert len(list_graded_prices(conn, watchlist_id)) == 1

    def test_list_ordered_by_grade(self, conn, watchlist_id):
        set_graded_price(conn, watchlist_id, "PSA", Decimal("10"), Decimal("400.00"))
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("120.00"))
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9.5"), Decimal("220.00"))

        rows = list_graded_prices(conn, watchlist_id)
        assert [r.grade for r in rows] == [Decimal("9"), Decimal("9.5"), Decimal("10")]

    def test_remove_deletes_the_row(self, conn, watchlist_id):
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("120.00"))
        remove_graded_price(conn, watchlist_id, "PSA", Decimal("9"))

        assert get_graded_price(conn, watchlist_id, "PSA", Decimal("9")) is None

    def test_prices_are_scoped_per_watchlist_row(self, conn, watchlist_id):
        other_id = add_item(
            conn, game="pokemon", card_name="Charizard", set_name="Base", card_number="4/102",
            price_source=PriceSource.API, manual_market_price=None, discount_threshold=Decimal("0.25"),
            search_terms="charizard base", exclude_terms="", tier=Tier.STANDARD,
        )
        set_graded_price(conn, watchlist_id, "PSA", Decimal("9"), Decimal("120.00"))

        assert get_graded_price(conn, other_id, "PSA", Decimal("9")) is None
