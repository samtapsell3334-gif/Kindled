"""
eBay Buy Browse API client (application access token, client credentials
grant). Marketplace is EBAY_GB throughout.

Two documented gotchas this client exists to avoid (see build brief):

1. Auctions are not returned by a plain search — you must explicitly filter
   `buyingOptions:{AUCTION}` or `currentBidPrice`/`bidCount`/`itemEndDate`
   come back empty. So Buy It Now and Auction are two separate searches,
   never one query trying to cover both.
2. `itemEndDate` takes a *range* filter, not a single timestamp,  and its
   value needs URL encoding — handled here by letting `requests` encode the
   `filter` query param rather than hand-building the query string.

The base URL is config-driven (`EBAY_ENV=sandbox|production`) so flipping to
production once Buy API approval lands is a one-line env change, not a code
change.
"""

from __future__ import annotations

import base64
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import quote

import requests

from kestrel.config import Config
from kestrel.models import EbayListing, ListingType

logger = logging.getLogger("kestrel.ebay")

SEARCH_PATH = "/buy/browse/v1/item_summary/search"
ITEM_PATH = "/buy/browse/v1/item"
TOKEN_PATH = "/identity/v1/oauth2/token"
OAUTH_SCOPE = "https://api.ebay.com/oauth/api_scope"

# Retry on rate limiting and transient server errors; never retry on 4xx
# auth/validation errors (those need a human, not a backoff).
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


class EbayApiError(RuntimeError):
    pass


@dataclass
class _CachedToken:
    access_token: str
    expires_at: datetime


class EbayClient:
    def __init__(self, config: Config, session: requests.Session | None = None):
        self._config = config
        self._session = session or requests.Session()
        self._token: _CachedToken | None = None

    # -- OAuth -------------------------------------------------------

    def _get_access_token(self) -> str:
        now = datetime.now(timezone.utc)
        if self._token and self._token.expires_at > now + timedelta(seconds=60):
            return self._token.access_token

        creds = f"{self._config.ebay_client_id}:{self._config.ebay_client_secret}"
        basic_auth = base64.b64encode(creds.encode("utf-8")).decode("ascii")
        resp = self._session.post(
            f"{self._config.ebay_base_url}{TOKEN_PATH}",
            headers={
                "Authorization": f"Basic {basic_auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials", "scope": OAUTH_SCOPE},
            timeout=15,
        )
        if resp.status_code != 200:
            raise EbayApiError(f"eBay OAuth token request failed: {resp.status_code} {resp.text}")

        body = resp.json()
        token = body["access_token"]
        expires_in = int(body.get("expires_in", 7200))
        self._token = _CachedToken(
            access_token=token,
            expires_at=now + timedelta(seconds=expires_in),
        )
        return token

    # -- Low-level request with 429/5xx backoff ------------------------

    def _get_with_backoff(self, path: str, params: dict[str, str]) -> dict[str, Any]:
        max_retries = self._config.ebay_max_retries
        base = self._config.ebay_backoff_base_seconds
        last_error: Exception | None = None

        for attempt in range(max_retries + 1):
            token = self._get_access_token()
            resp = self._session.get(
                f"{self._config.ebay_base_url}{path}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-EBAY-C-MARKETPLACE-ID": self._config.ebay_marketplace_id,
                    "Accept": "application/json",
                },
                params=params,
                timeout=20,
            )

            if resp.status_code == 200:
                return resp.json()

            if resp.status_code not in RETRYABLE_STATUS_CODES or attempt == max_retries:
                raise EbayApiError(f"eBay search failed: {resp.status_code} {resp.text}")

            retry_after = resp.headers.get("Retry-After")
            if retry_after:
                try:
                    delay = float(retry_after)
                except ValueError:
                    delay = base * (2**attempt)
            else:
                delay = base * (2**attempt)

            logger.warning(
                "eBay search got %s, backing off %.1fs (attempt %d/%d)",
                resp.status_code,
                delay,
                attempt + 1,
                max_retries,
            )
            last_error = EbayApiError(f"eBay search failed: {resp.status_code} {resp.text}")
            time.sleep(delay)

        # Unreachable in practice (loop always returns or raises), but keeps
        # mypy/type-checkers happy and fails loudly if it somehow is reached.
        raise last_error or EbayApiError("eBay search failed after retries")

    # -- Searches -------------------------------------------------------

    def search_buy_it_now(self, search_terms: str, limit: int = 50) -> list[EbayListing]:
        params = {
            "q": search_terms,
            "filter": "buyingOptions:{FIXED_PRICE}",
            "limit": str(limit),
            "fieldgroups": "MATCHING_ITEMS",
        }
        body = self._get_with_backoff(SEARCH_PATH, params)
        return [normalize_item(raw) for raw in body.get("itemSummaries", [])]

    def get_item_condition_detail(self, item_id: str) -> str | None:
        """
        One extra call, deliberately only spent on listings that already
        cleared every other filter (price, title, printing) — not on every
        raw search result, to stay inside the call budget.

        Confirmed against production: the item detail endpoint carries a
        real, structured, trading-card-specific condition field
        (conditionDescriptors -> "Card Condition") that eBay's own search
        summary doesn't return — seller-declared values like "Heavily
        played (Poor)" or "Lightly played (Excellent)", plus additionalInfo
        defect notes ("Major creasing", "Fuzzy corners", ...). This is a
        far better signal than guessing from the title alone. Returns None
        on any failure (network error, 404, missing field) rather than
        raising — the title-based guess_condition_hint fallback already
        covers that case in poller.py.
        """
        try:
            body = self._get_with_backoff(f"{ITEM_PATH}/{quote(item_id, safe='')}", {})
        except EbayApiError:
            logger.warning("Could not fetch item detail for %s — falling back to title-only condition guess", item_id, exc_info=True)
            return None

        descriptors = body.get("conditionDescriptors") or []
        for descriptor in descriptors:
            if descriptor.get("name") != "Card Condition":
                continue
            values = descriptor.get("values") or []
            if not values:
                continue
            content = values[0].get("content")
            extra = values[0].get("additionalInfo") or []
            if content and extra:
                return f"{content} — {', '.join(extra)}"
            return content
        return None

    def search_auctions(
        self,
        search_terms: str,
        *,
        window_minutes: int,
        max_bid_count: int,
        limit: int = 50,
        now: datetime | None = None,
    ) -> list[EbayListing]:
        now = now or datetime.now(timezone.utc)
        window_end = now + timedelta(minutes=window_minutes)
        # End-only range, deliberately no lower bound: eBay rejects
        # itemEndDate ranges whose start isn't strictly in the future
        # (errorId 12002, "filter value is invalid") -- and "now" is
        # already technically past by the time the request lands, even a
        # few hundred ms later. An end-only bound (confirmed against the
        # real API) captures anything ending before the cutoff; anything
        # already-ended is filtered client-side in matcher.evaluate_listing
        # via minutes_remaining, so nothing stale slips through.
        end_range = f"itemEndDate:[..{_iso(window_end)}]"
        bid_range = f"bidCount:[0..{max_bid_count}]"
        params = {
            "q": search_terms,
            "filter": f"buyingOptions:{{AUCTION}},{end_range},{bid_range}",
            "limit": str(limit),
            "fieldgroups": "MATCHING_ITEMS",
        }
        body = self._get_with_backoff(SEARCH_PATH, params)
        return [normalize_item(raw) for raw in body.get("itemSummaries", [])]


def _iso(dt: datetime) -> str:
    """eBay expects UTC timestamps like 2026-09-14T20:00:00Z (verified against
    the real API — a `.000` milliseconds suffix isn't required, and isn't
    used here since it wasn't part of the confirmed-working format)."""
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _decimal_or_zero(raw: dict[str, Any] | None, key: str = "value") -> Decimal:
    if not raw or key not in raw:
        return Decimal("0")
    try:
        return Decimal(str(raw[key]))
    except InvalidOperation:
        return Decimal("0")


def _shipping_cost(raw: dict[str, Any]) -> Decimal:
    options = raw.get("shippingOptions") or []
    if not options:
        return Decimal("0")
    # Use the cheapest shipping option available in the search response.
    # Exact-per-listing shipping cost sometimes requires the item detail
    # endpoint (an extra call per candidate) — deliberately not fetched
    # here to stay inside the daily call budget; this is the search
    # response's own estimate.
    costs = [_decimal_or_zero(opt.get("shippingCost")) for opt in options]
    return min(costs) if costs else Decimal("0")


def normalize_item(raw: dict[str, Any]) -> EbayListing:
    buying_options = raw.get("buyingOptions") or []
    listing_type = ListingType.AUCTION if "AUCTION" in buying_options else ListingType.BUY_IT_NOW

    item_end_date = None
    if raw.get("itemEndDate"):
        item_end_date = datetime.strptime(raw["itemEndDate"], "%Y-%m-%dT%H:%M:%S.%fZ").replace(
            tzinfo=timezone.utc
        )

    image_url = (raw.get("image") or {}).get("imageUrl")

    return EbayListing(
        item_id=raw["itemId"],
        title=raw.get("title", ""),
        listing_type=listing_type,
        item_price=_decimal_or_zero(raw.get("price")),
        shipping_price=_shipping_cost(raw),
        item_web_url=raw.get("itemWebUrl", ""),
        image_url=image_url,
        current_bid_price=_decimal_or_zero(raw.get("currentBidPrice")) if listing_type == ListingType.AUCTION else None,
        bid_count=int(raw["bidCount"]) if raw.get("bidCount") is not None else None,
        item_end_date=item_end_date,
        accepts_best_offer="BEST_OFFER" in buying_options,
    )
