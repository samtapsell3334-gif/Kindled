from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from kestrel.matcher import (
    description_is_guarded,
    discount_percentage,
    estimate_net_profit,
    evaluate_listing,
    guess_condition_hint,
    max_bid,
    net_breakeven_cap,
    quantize_money,
    price_confidence_pct,
    suggest_offer_gbp,
    is_condition_acceptable,
    title_is_excluded,
    title_matches_card_name,
    title_matches_printing,
    with_merchandise_guard,
    with_non_english_guard,
    with_reprint_guard,
)
from kestrel.models import DetectedGrade, EbayListing, ListingType, PriceSource, Tier, WatchlistItem

NOW = datetime(2026, 9, 14, 20, 0, 0, tzinfo=timezone.utc)


def make_item(**overrides) -> WatchlistItem:
    defaults = dict(
        id=1,
        game="pokemon",
        card_name="Charizard",
        set_name="Base Set",
        card_number="4/102",
        price_source=PriceSource.API,
        manual_market_price=None,
        discount_threshold=Decimal("0.40"),
        search_terms="charizard base set 4/102",
        exclude_terms="proxy,custom,lot,digital",
        tier=Tier.STANDARD,
        active=True,
        last_polled_at=None,
    )
    defaults.update(overrides)
    return WatchlistItem(**defaults)


def make_bin_listing(**overrides) -> EbayListing:
    defaults = dict(
        item_id="item-1",
        title="Charizard Base Set 4/102 Holo",
        listing_type=ListingType.BUY_IT_NOW,
        item_price=Decimal("50.00"),
        shipping_price=Decimal("3.00"),
        item_web_url="https://ebay.co.uk/itm/1",
        image_url="https://img/1.jpg",
    )
    defaults.update(overrides)
    return EbayListing(**defaults)


def make_auction_listing(**overrides) -> EbayListing:
    defaults = dict(
        item_id="item-2",
        title="Charizard Base Set 4/102 Holo",
        listing_type=ListingType.AUCTION,
        item_price=Decimal("0"),
        shipping_price=Decimal("3.00"),
        item_web_url="https://ebay.co.uk/itm/2",
        image_url=None,
        current_bid_price=Decimal("40.00"),
        bid_count=1,
        item_end_date=NOW + timedelta(minutes=5),
    )
    defaults.update(overrides)
    return EbayListing(**defaults)


class TestMaxBid:
    def test_basic(self):
        assert max_bid(Decimal("100"), Decimal("0.40")) == Decimal("60.00")

    def test_rounds_half_up(self):
        # 33.335 rounds up to 33.34 under ROUND_HALF_UP, not banker's rounding.
        assert quantize_money(Decimal("33.335")) == Decimal("33.34")

    def test_zero_threshold_means_market_price_is_cap(self):
        assert max_bid(Decimal("100"), Decimal("0")) == Decimal("100.00")


class TestDiscountPercentage:
    def test_basic(self):
        assert discount_percentage(Decimal("60"), Decimal("100")) == Decimal("40.00")

    def test_zero_market_price_is_safe(self):
        assert discount_percentage(Decimal("10"), Decimal("0")) == Decimal("0")


class TestNetBreakevenCap:
    def test_basic(self):
        # market=17, fee=13% -> 14.79, minus £3 postage -> 11.79
        assert net_breakeven_cap(Decimal("17.00"), Decimal("0.13"), Decimal("3.00")) == Decimal("11.79")

    def test_zero_fee_and_postage_equals_market_price(self):
        assert net_breakeven_cap(Decimal("100.00"), Decimal("0"), Decimal("0")) == Decimal("100.00")

    def test_high_fixed_postage_can_exceed_market_price_giving_negative_cap(self):
        # A cheap card with real postage costs can have no viable breakeven at all.
        result = net_breakeven_cap(Decimal("5.00"), Decimal("0.13"), Decimal("3.00"))
        assert result < Decimal("2.00")


class TestEstimateNetProfit:
    def test_matches_the_readme_worked_example(self):
        # £10 acquisition, £17 market, 13% fee, £3 postage -> ~£1.79 profit,
        # not the ~£7 the gross 40%-off framing would suggest.
        profit = estimate_net_profit(Decimal("10.00"), Decimal("17.00"), Decimal("0.13"), Decimal("3.00"))
        assert profit == Decimal("1.79")

    def test_negative_when_acquisition_cost_exceeds_breakeven(self):
        profit = estimate_net_profit(Decimal("15.00"), Decimal("17.00"), Decimal("0.13"), Decimal("3.00"))
        assert profit < Decimal("0")

    def test_zero_fee_and_postage_is_just_market_minus_cost(self):
        profit = estimate_net_profit(Decimal("60.00"), Decimal("100.00"), Decimal("0"), Decimal("0"))
        assert profit == Decimal("40.00")


class TestTitleExclusion:
    def test_excluded_term_matches_case_insensitively(self):
        assert title_is_excluded("PROXY Charizard card", ["proxy"])

    def test_no_match(self):
        assert not title_is_excluded("Charizard Base Set Holo", ["proxy", "lot"])

    def test_empty_terms_never_excludes(self):
        assert not title_is_excluded("anything", [])


class TestNonEnglishGuard:
    """title_matches_card_name only checks the English name is present
    somewhere in the title -- a bilingual listing like "Charizard 4/102
    Glurak Base Set DE" still passes that check, so a foreign-language
    print needs its own guard via exclude_terms."""

    def test_appends_guard_terms_to_existing_exclude_terms(self):
        merged = with_non_english_guard("proxy,custom")
        terms = merged.split(",")
        assert terms[:2] == ["proxy", "custom"]
        assert "french" in terms
        assert "(jp)" in terms

    def test_does_not_duplicate_a_guard_term_already_present(self):
        merged = with_non_english_guard("proxy,French")
        terms = [t.lower() for t in merged.split(",")]
        assert terms.count("french") == 1

    def test_empty_exclude_terms_still_gets_the_guard(self):
        merged = with_non_english_guard("")
        assert "german" in merged.split(",")

    def test_guard_actually_excludes_a_foreign_listing(self):
        exclude_terms = with_non_english_guard("proxy").split(",")
        assert title_is_excluded("Charizard 4/102 Glurak Base Set German Print Holo", exclude_terms)

    def test_guard_never_excludes_a_plain_english_listing(self):
        exclude_terms = with_non_english_guard("proxy").split(",")
        assert not title_is_excluded("Charizard 4/102 Base Set Holo Near Mint", exclude_terms)

    def test_guard_does_not_falsely_exclude_common_english_words(self):
        # The whole reason bare 2-letter codes ("fr", "de") aren't used --
        # they'd substring-match ordinary English words and silently
        # exclude huge numbers of genuine listings.
        exclude_terms = with_non_english_guard("").split(",")
        assert not title_is_excluded("Card shipped from the UK, a great deal", exclude_terms)


class TestMerchandiseGuard:
    """Real, confirmed false-positive class: modern chase-card searches
    matching non-card merchandise (keychains, 'card not included' display
    panels, fan-art prints, PSA slab skins) that title_matches_card_name()
    can't tell apart from the real card, since the merchandise title still
    contains the card's name."""

    def test_appends_guard_terms_to_existing_exclude_terms(self):
        merged = with_merchandise_guard("proxy,custom")
        terms = merged.split(",")
        assert terms[:2] == ["proxy", "custom"]
        assert "keychain" in terms
        assert "card not included" in terms

    def test_does_not_duplicate_a_guard_term_already_present(self):
        merged = with_merchandise_guard("proxy,Keychain")
        terms = [t.lower() for t in merged.split(",")]
        assert terms.count("keychain") == 1

    def test_guard_excludes_a_card_not_included_display_listing(self):
        exclude_terms = with_merchandise_guard("proxy").split(",")
        assert title_is_excluded(
            "Vaporeon ex Prismatic Evolutions Display Panel - Card not included", exclude_terms
        )

    def test_guard_excludes_a_keychain_listing(self):
        exclude_terms = with_merchandise_guard("proxy").split(",")
        assert title_is_excluded("Sylveon VMAX Evolving Skies Acrylic Keychain", exclude_terms)

    def test_guard_excludes_a_fan_art_print_listing(self):
        exclude_terms = with_merchandise_guard("proxy").split(",")
        assert title_is_excluded("Leafeon ex Fan Art Print Poster", exclude_terms)

    def test_guard_excludes_a_slab_skin_listing(self):
        exclude_terms = with_merchandise_guard("proxy").split(",")
        assert title_is_excluded("Rayquaza V Extended Art Slab Skin for PSA", exclude_terms)

    def test_guard_never_excludes_a_plain_english_listing(self):
        exclude_terms = with_merchandise_guard("proxy").split(",")
        assert not title_is_excluded("Charizard 4/102 Base Set Holo Near Mint", exclude_terms)

    def test_guard_excludes_an_extended_artwork_case_listing(self):
        exclude_terms = with_merchandise_guard("proxy").split(",")
        assert title_is_excluded("Pokemon Lugia 9/111 Neo Genesis Extended Artwork Case", exclude_terms)


class TestWithReprintGuard:
    """Real, confirmed case: a 2026 '30th Anniversary'/'30th Celebration(s)'
    reprint reuses a vintage chase card's exact set number (Shining Celebi
    106/105, same as the real Neo Destiny card), so it number-matches and
    name-matches every vintage-targeting row -- but is a much lower-value
    mass reprint, not the card the market price is based on."""

    def test_appends_reprint_guard_terms(self):
        merged = with_reprint_guard("proxy,custom")
        terms = merged.split(",")
        assert terms[:2] == ["proxy", "custom"]
        assert "30th anniversary" in terms

    def test_does_not_duplicate_a_term_already_present(self):
        merged = with_reprint_guard("proxy,30th Anniversary")
        terms = [t.lower() for t in merged.split(",")]
        assert terms.count("30th anniversary") == 1

    def test_guard_excludes_a_30th_anniversary_reprint_listing(self):
        exclude_terms = with_reprint_guard("proxy").split(",")
        assert title_is_excluded(
            "Pokémon TCG Shining Celebi 106/105 30th Anniversary Unlimited English", exclude_terms
        )

    def test_guard_excludes_a_30th_celebrations_reprint_listing(self):
        exclude_terms = with_reprint_guard("proxy").split(",")
        assert title_is_excluded(
            "Shining Celebi 106/105 30th Celebrations Holo Rare Pokémon TCG Card 2026 English", exclude_terms
        )

    def test_guard_never_excludes_the_genuine_vintage_listing(self):
        exclude_terms = with_reprint_guard("proxy").split(",")
        assert not title_is_excluded(
            "Pokémon TCG Shining Celebi 106/105 Neo Destiny Secret Rare Holo English 2000", exclude_terms
        )


class TestDescriptionIsGuarded:
    """Real finding: a seller listed several correctly-numbered chase cards
    at a uniform, far-below-market price with a title clean of every
    MERCHANDISE_GUARD_TERMS phrase. Only the listing's shortDescription
    ("As this is a handmade card...") revealed it was a custom/fan print,
    not a real one -- see EbayClient.get_item_description."""

    def test_flags_a_handmade_card_disclaimer(self):
        assert description_is_guarded(
            "As this is a handmade card, it may contain imperfections in cutting and centering."
        )

    def test_flags_a_replica_disclaimer(self):
        assert description_is_guarded("High quality replica of the original card.")

    def test_flags_a_reproduction_disclaimer(self):
        assert description_is_guarded("This is a reproduction for display purposes only.")

    def test_still_catches_title_level_guard_terms(self):
        assert description_is_guarded("Card not included, display stand only.")

    def test_never_flags_a_genuine_description(self):
        assert not description_is_guarded("Genuine card from my personal collection, ships same day.")


class TestIsConditionAcceptable:
    """Gate added after a real finding: every inflated 'profit' figure in a
    batch of low-value auction alerts traced back to played copies being
    compared against an untouched NM/Mint reference price. Only Near
    Mint+/Mint or professionally graded listings should ever become a
    match now."""

    def test_ebays_real_near_mint_field_passes(self):
        assert is_condition_acceptable("Near mint or better — Minor corner and edge wear")

    def test_title_guess_near_mint_label_passes(self):
        assert is_condition_acceptable("near mint")

    def test_lightly_played_is_rejected(self):
        assert not is_condition_acceptable("Lightly played (Excellent) — Moderate surface scuffing")

    def test_moderately_played_is_rejected(self):
        assert not is_condition_acceptable("Moderately played (Very good) — Moderate creasing")

    def test_heavily_played_is_rejected(self):
        assert not is_condition_acceptable("Heavily played (Poor) — Major creasing, Heavily worn corners")

    def test_damaged_is_rejected(self):
        assert not is_condition_acceptable("damaged")

    def test_not_stated_is_rejected(self):
        assert not is_condition_acceptable("not stated")

    def test_graded_condition_text_passes(self):
        assert is_condition_acceptable("graded")

    def test_psa_mentioned_in_condition_text_passes(self):
        assert is_condition_acceptable("PSA 9 — see photos")

    def test_a_detected_grade_always_passes_regardless_of_condition_text(self):
        grade = DetectedGrade(company="PSA", grade=Decimal("9"))
        # even a condition string that would otherwise fail
        assert is_condition_acceptable("Heavily played (Poor)", detected_grade=grade)


class TestTitleMatchesCardName:
    """Regression coverage for a real finding: eBay's q= search does loose
    keyword matching, not exact-phrase matching. Searching "ten thousand
    dragon yugioh" returned "Manju of the Ten Thousand Hands" at 1% of the
    real card's price -- a false "99% off" deal for entirely the wrong card."""

    def test_exact_name_matches(self):
        assert title_matches_card_name("Charizard Base Set 4/102 Holo", "Charizard")

    def test_case_insensitive(self):
        assert title_matches_card_name("CHARIZARD base set", "charizard")

    def test_hyphen_normalizes_to_space(self):
        assert title_matches_card_name("Yu-Gi-Oh! Ten-Thousand Dragon Secret Rare", "Ten Thousand Dragon")

    def test_pipe_and_punctuation_normalizes(self):
        assert title_matches_card_name("Custom|Ten Thousand Dragon|Ultimate Rare", "Ten Thousand Dragon")

    def test_real_false_positive_is_rejected(self):
        # The actual listing this check exists to catch.
        assert not title_matches_card_name(
            "YuGiOh! Manju of the Ten Thousand Hands GFP2-EN099 Ultra Rare 1st Ed",
            "Ten Thousand Dragon",
        )

    def test_unrelated_bulk_lot_is_rejected(self):
        assert not title_matches_card_name(
            "Selection of 100+ Used YuGiOh! Common Deck Building Staples #1 | Goat Cards!",
            "Ten Thousand Dragon",
        )

    def test_empty_card_name_never_blocks(self):
        # Defensive: a blank card_name shouldn't silently reject everything.
        assert title_matches_card_name("anything at all", "")


class TestTitleMatchesPrinting:
    """Regression coverage for a real finding: for common creature names
    reprinted many times, a name-only check isn't enough. A row tracking
    the £171 1999 Fossil Gengar (5/62) matched a £2.23 modern reprint
    ("Gengar 050/088 130 HP") -- same name, completely different card and
    price tier."""

    def test_collector_format_number_matches(self):
        assert title_matches_printing("Gengar 5/62 Fossil Holo Rare Unlimited", "5/62")

    def test_numerator_only_in_title_still_matches(self):
        # Sellers sometimes write just "#5" rather than the full "5/62".
        assert title_matches_printing("Gengar Fossil Holo #5 Rare Card", "5/62")

    def test_real_wrong_printing_is_rejected(self):
        assert not title_matches_printing("Pokémon TCG Gengar 050/088 130 HP Holo Rare Card", "5/62")

    def test_no_card_number_on_row_never_blocks(self):
        # Yu-Gi-Oh rows have no card_number at all (see pricing/yugioh.py) --
        # this check must be a no-op for them, not reject everything.
        assert title_matches_printing("Ten Thousand Dragon BLAR-EN10K Secret Rare", None)
        assert title_matches_printing("Ten Thousand Dragon BLAR-EN10K Secret Rare", "")


class TestGuessConditionHint:
    def test_graded_from_psa(self):
        assert guess_condition_hint("1999 Pokemon Fossil Gengar PSA 9") == "graded"

    def test_near_mint(self):
        assert guess_condition_hint("Gengar 5/62 Fossil Holo Card NM") == "near mint"

    def test_lightly_played(self):
        assert guess_condition_hint("Gengar 5/62 Fossil Holo LP") == "lightly played"

    def test_heavily_played(self):
        assert guess_condition_hint("Gengar 5/62 Fossil Holo Card WOTC MP+") == "moderately played"

    def test_damaged_takes_priority_over_heavily_played(self):
        # "HP/DMG" -- damaged is the more severe, more accurate read, and is
        # checked first for exactly that reason.
        assert guess_condition_hint("Gengar 5/62 Fossil Holo Rare Pokemon HP/DMG") == "damaged"

    def test_unstated_condition(self):
        assert guess_condition_hint("Gengar 5/62 Holo Fossil") == "not stated"

    def test_case_insensitive(self):
        assert guess_condition_hint("GENGAR FOSSIL psa 8") == "graded"


class TestEvaluateBuyItNow:
    def test_matches_when_at_or_under_cap(self):
        item = make_item(discount_threshold=Decimal("0.40"))
        listing = make_bin_listing(item_price=Decimal("57.00"), shipping_price=Decimal("3.00"))  # total 60.00
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is not None
        assert result.max_bid_gbp == Decimal("60.00")
        assert result.discount_pct == Decimal("40.00")

    def test_no_match_over_cap(self):
        item = make_item()
        listing = make_bin_listing(item_price=Decimal("58.00"), shipping_price=Decimal("3.00"))  # total 61.00
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_real_wrong_card_false_positive_is_rejected(self):
        # The exact real-world case this check exists for: a wildly cheap
        # listing that clears the cap on price alone, but is a different
        # card entirely that eBay's loose keyword search matched anyway.
        item = make_item(card_name="Ten Thousand Dragon", discount_threshold=Decimal("0.25"))
        listing = make_bin_listing(
            title="YuGiOh! Manju of the Ten Thousand Hands GFP2-EN099 Ultra Rare 1st Ed",
            item_price=Decimal("1.49"),
            shipping_price=Decimal("0"),
        )
        result = evaluate_listing(
            listing, item, Decimal("480.95"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_postage_is_included_in_comparison(self):
        item = make_item()
        # item price alone is under cap, but + postage pushes it over
        listing = make_bin_listing(item_price=Decimal("59.00"), shipping_price=Decimal("5.00"))  # total 64.00
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_excluded_title_never_matches_even_under_cap(self):
        item = make_item()
        listing = make_bin_listing(title="PROXY Charizard", item_price=Decimal("10.00"), shipping_price=Decimal("0"))
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None


class TestSuggestOfferGbp:
    def test_targets_below_breakeven_cap_minus_shipping(self):
        listing = make_bin_listing(item_price=Decimal("60.00"), shipping_price=Decimal("3.00"))
        # breakeven cap 50.00, minus 3.00 shipping = 47.00, minus 10% margin = 42.30
        offer = suggest_offer_gbp(listing, net_breakeven_cap=Decimal("50.00"), negotiation_margin=Decimal("0.10"))
        assert offer == Decimal("42.30")

    def test_never_offers_more_than_asking_item_price(self):
        listing = make_bin_listing(item_price=Decimal("20.00"), shipping_price=Decimal("0"))
        # breakeven cap is huge, so the raw target would be way above asking
        offer = suggest_offer_gbp(listing, net_breakeven_cap=Decimal("500.00"), negotiation_margin=Decimal("0.10"))
        assert offer == Decimal("20.00")

    def test_none_when_breakeven_cap_does_not_cover_shipping(self):
        listing = make_bin_listing(item_price=Decimal("10.00"), shipping_price=Decimal("5.00"))
        offer = suggest_offer_gbp(listing, net_breakeven_cap=Decimal("4.00"))
        assert offer is None

    def test_none_for_auction_listings(self):
        listing = make_auction_listing()
        offer = suggest_offer_gbp(listing, net_breakeven_cap=Decimal("500.00"))
        assert offer is None


class TestPriceConfidencePct:
    def test_manual_price_scores_highest(self):
        assert price_confidence_pct(
            price_source=PriceSource.MANUAL, has_full_identity=True, is_first_fetch=False, is_anomalous=False
        ) == Decimal("90")

    def test_full_identity_repeat_fetch_scores_75(self):
        assert price_confidence_pct(
            price_source=PriceSource.API, has_full_identity=True, is_first_fetch=False, is_anomalous=False
        ) == Decimal("75")

    def test_first_ever_fetch_scores_lower_than_a_repeat(self):
        assert price_confidence_pct(
            price_source=PriceSource.API, has_full_identity=True, is_first_fetch=True, is_anomalous=False
        ) == Decimal("60")

    def test_missing_set_or_number_scores_lower_still(self):
        assert price_confidence_pct(
            price_source=PriceSource.API, has_full_identity=False, is_first_fetch=False, is_anomalous=False
        ) == Decimal("40")

    def test_anomalous_price_overrides_everything_else(self):
        assert price_confidence_pct(
            price_source=PriceSource.MANUAL, has_full_identity=True, is_first_fetch=False, is_anomalous=True
        ) == Decimal("25")


class TestEvaluateListingBestOffer:
    def test_sets_suggested_offer_when_listing_accepts_best_offer(self):
        item = make_item(discount_threshold=Decimal("0.40"))
        listing = make_bin_listing(
            item_price=Decimal("57.00"), shipping_price=Decimal("3.00"), accepts_best_offer=True
        )
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is not None
        assert result.suggested_offer_gbp is not None

    def test_no_suggested_offer_when_listing_does_not_accept_it(self):
        item = make_item(discount_threshold=Decimal("0.40"))
        listing = make_bin_listing(
            item_price=Decimal("57.00"), shipping_price=Decimal("3.00"), accepts_best_offer=False
        )
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is not None
        assert result.suggested_offer_gbp is None


class TestEvaluateListingGradedPricing:
    """A slab's cap/discount must be judged against its real graded value
    when one's been entered, not the raw/ungraded reference price -- see
    evaluate_listing's docstring for the real gap this closes: a slab
    priced above the raw-based cap but genuinely cheap for its actual grade
    was previously rejected before ever reaching a human."""

    def test_manual_graded_price_is_used_for_the_cap_not_raw_price(self):
        item = make_item(discount_threshold=Decimal("0.25"))
        # Raw market is 60.00 -> a 25%-off cap of 45.00 would reject this
        # 70.00 listing outright. But it's PSA 9, and the real PSA 9 value
        # (200.00) makes 70.00 a genuine 65%+ discount.
        listing = make_bin_listing(
            title="Charizard Base Set 4/102 PSA 9 Holo", item_price=Decimal("70.00"), shipping_price=Decimal("0")
        )
        result = evaluate_listing(
            listing, item, Decimal("60.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW,
            graded_prices={("PSA", Decimal("9")): Decimal("200.00")},
        )
        assert result is not None
        assert result.detected_grade.company == "PSA"
        assert result.graded_market_price_gbp == Decimal("200.00")
        assert result.max_bid_gbp == Decimal("150.00")  # 200 * (1 - 0.25), not 60 * 0.75
        assert result.discount_pct == Decimal("65.00")  # against the graded price
        assert result.market_price_gbp == Decimal("60.00")  # raw reference still recorded, just not used for the gate

    def test_graded_listing_priced_above_graded_cap_is_still_rejected(self):
        item = make_item(discount_threshold=Decimal("0.25"))
        listing = make_bin_listing(
            title="Charizard Base Set 4/102 PSA 9 Holo", item_price=Decimal("180.00"), shipping_price=Decimal("0")
        )
        result = evaluate_listing(
            listing, item, Decimal("60.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW,
            graded_prices={("PSA", Decimal("9")): Decimal("200.00")},
        )
        assert result is None  # 180 > 150 (the graded cap), even though it's well under the raw-based one

    def test_grade_detected_but_no_manual_price_falls_back_to_raw_and_still_flags_it(self):
        item = make_item(discount_threshold=Decimal("0.25"))
        listing = make_bin_listing(
            title="Charizard Base Set 4/102 PSA 9 Holo", item_price=Decimal("40.00"), shipping_price=Decimal("0")
        )
        result = evaluate_listing(
            listing, item, Decimal("60.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW,
            graded_prices={("BGS", Decimal("9.5")): Decimal("300.00")},  # a different grade, doesn't apply
        )
        assert result is not None
        assert result.detected_grade.company == "PSA"  # still surfaced...
        assert result.graded_market_price_gbp is None  # ...but not priced
        assert result.max_bid_gbp == Decimal("45.00")  # falls back to the raw-based cap (60 * 0.75)

    def test_no_grade_in_title_is_unaffected_by_a_populated_graded_prices_dict(self):
        item = make_item(discount_threshold=Decimal("0.25"))
        listing = make_bin_listing(item_price=Decimal("40.00"), shipping_price=Decimal("0"))  # no grade in title
        result = evaluate_listing(
            listing, item, Decimal("60.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW,
            graded_prices={("PSA", Decimal("9")): Decimal("200.00")},
        )
        assert result is not None
        assert result.detected_grade is None
        assert result.max_bid_gbp == Decimal("45.00")


class TestEvaluateAuction:
    def test_matches_within_window_and_bid_cap(self):
        item = make_item()
        listing = make_auction_listing(current_bid_price=Decimal("57.00"), bid_count=1)
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is not None

    def test_no_match_too_many_bids(self):
        item = make_item()
        listing = make_auction_listing(bid_count=3)
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_no_match_outside_time_window(self):
        item = make_item()
        listing = make_auction_listing(item_end_date=NOW + timedelta(minutes=30))
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_no_match_already_ended(self):
        item = make_item()
        listing = make_auction_listing(item_end_date=NOW - timedelta(minutes=1))
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None

    def test_compares_current_bid_not_buy_it_now_price(self):
        item = make_item()
        listing = make_auction_listing(current_bid_price=Decimal("61.00"), bid_count=0)  # + 3 shipping = 64 > 60 cap
        result = evaluate_listing(
            listing, item, Decimal("100.00"), auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is None


class TestManualPriceSource:
    def test_manual_market_price_used_directly(self):
        item = make_item(
            game="football",
            price_source=PriceSource.MANUAL,
            manual_market_price=Decimal("20.00"),
            discount_threshold=Decimal("0.5"),
        )
        listing = make_bin_listing(item_price=Decimal("8.00"), shipping_price=Decimal("2.00"))  # total 10.00
        result = evaluate_listing(
            listing, item, item.manual_market_price, auction_window_minutes=10, auction_max_bid_count=2, now=NOW
        )
        assert result is not None
        assert result.max_bid_gbp == Decimal("10.00")
