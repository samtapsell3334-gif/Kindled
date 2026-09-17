"""
Kestrel configuration.

Everything that could reasonably change between machines, environments, or
personal taste lives here and is sourced from environment variables (see
`.env.example`). Nothing in the rest of the codebase should hardcode a
threshold, URL, or interval — import it from here instead.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the kestrel/ directory regardless of current working
# directory (cron jobs in particular tend to run with an unpredictable cwd).
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH)


def _env_str(name: str, default: str) -> str:
    return os.environ.get(name, default)


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    return int(raw) if raw else default


def _env_decimal(name: str, default: str) -> Decimal:
    raw = os.environ.get(name)
    return Decimal(raw) if raw else Decimal(default)


def _env_optional(name: str) -> str | None:
    raw = os.environ.get(name)
    return raw if raw else None


@dataclass(frozen=True)
class Config:
    # --- Storage -----------------------------------------------------
    db_path: Path = field(
        default_factory=lambda: Path(
            _env_str("KESTREL_DB_PATH", str(Path(__file__).resolve().parent.parent / "kestrel.db"))
        )
    )

    # --- Polling -------------------------------------------------------
    poll_interval_seconds: int = field(default_factory=lambda: _env_int("POLL_INTERVAL_SECONDS", 300))
    auction_alert_window_minutes: int = field(
        default_factory=lambda: _env_int("AUCTION_ALERT_WINDOW_MINUTES", 10)
    )
    auction_max_bid_count: int = field(default_factory=lambda: _env_int("AUCTION_MAX_BID_COUNT", 2))
    default_discount_threshold: Decimal = field(
        default_factory=lambda: _env_decimal("DEFAULT_DISCOUNT_THRESHOLD", "0.40")
    )

    # --- Resale economics (net-of-fees estimate) ---------------------------
    # Every alert's headline discount % is against GROSS market price — it
    # doesn't know about the cost of actually reselling. These two values
    # estimate that cost so a real net profit/breakeven number can sit next
    # to the gross one. Both are estimates, not live-looked-up: eBay's real
    # fee structure has category nuances and occasional fee-free promotions,
    # and postage cost depends on what service you actually choose — tune
    # both to your own real numbers rather than trust the defaults blindly.
    ebay_seller_fee_rate: Decimal = field(default_factory=lambda: _env_decimal("EBAY_SELLER_FEE_RATE", "0.13"))
    resale_postage_gbp: Decimal = field(default_factory=lambda: _env_decimal("RESALE_POSTAGE_GBP", "3.00"))

    # --- eBay Browse API -------------------------------------------------
    ebay_env: str = field(default_factory=lambda: _env_str("EBAY_ENV", "sandbox"))  # "sandbox" | "production"
    ebay_client_id: str = field(default_factory=lambda: _env_str("EBAY_CLIENT_ID", ""))
    ebay_client_secret: str = field(default_factory=lambda: _env_str("EBAY_CLIENT_SECRET", ""))
    ebay_marketplace_id: str = field(default_factory=lambda: _env_str("EBAY_MARKETPLACE_ID", "EBAY_GB"))
    # Daily call budget for the Browse API search endpoint. eBay's default
    # application-tier limit for buy.browse item_summary/search is 5000
    # calls/day (shared across the app, not per-watchlist-row) — this is
    # what makes call-budgeting necessary once the watchlist grows past a
    # handful of rows. Leave headroom below the real ceiling for manual
    # testing / retries.
    ebay_daily_call_budget: int = field(default_factory=lambda: _env_int("EBAY_DAILY_CALL_BUDGET", 4500))
    ebay_max_retries: int = field(default_factory=lambda: _env_int("EBAY_MAX_RETRIES", 4))
    ebay_backoff_base_seconds: float = field(
        default_factory=lambda: float(_env_str("EBAY_BACKOFF_BASE_SECONDS", "1.0"))
    )

    # --- Pokémon pricing (pokemontcg.io) ---------------------------------
    pokemontcg_api_key: str | None = field(default_factory=lambda: _env_optional("POKEMONTCG_API_KEY"))
    pokemontcg_base_url: str = field(
        default_factory=lambda: _env_str("POKEMONTCG_BASE_URL", "https://api.pokemontcg.io/v2")
    )

    # --- Yu-Gi-Oh pricing (YGOPRODeck) -----------------------------------
    ygoprodeck_base_url: str = field(
        default_factory=lambda: _env_str("YGOPRODECK_BASE_URL", "https://db.ygoprodeck.com/api/v7")
    )

    # --- Price cache -----------------------------------------------------
    price_cache_hours: int = field(default_factory=lambda: _env_int("PRICE_CACHE_HOURS", 12))

    # --- Currency conversion ----------------------------------------------
    # Neither pricing API returns GBP: pokemontcg.io's `cardmarket` block is
    # EUR (European market — closer to a UK comp than TCGplayer's USD, so we
    # prefer it) and YGOPRODeck's prices are USD (TCGplayer). eBay UK
    # listings are GBP, so a rate is applied at fetch time. These are static
    # config values, not a live FX feed — update them periodically by hand,
    # or wire in a free FX API in a later phase if drift becomes a problem.
    fx_eur_to_gbp: Decimal = field(default_factory=lambda: _env_decimal("FX_EUR_TO_GBP_RATE", "0.86"))
    fx_usd_to_gbp: Decimal = field(default_factory=lambda: _env_decimal("FX_USD_TO_GBP_RATE", "0.79"))

    # --- Telegram alerts (phase 2) -----------------------------------------
    # Both empty by default -> Telegram is simply skipped (console/log output
    # still happens regardless). Get a bot token from @BotFather, and a chat
    # id by messaging the bot once and reading it back from getUpdates — see
    # README for the exact steps.
    telegram_bot_token: str | None = field(default_factory=lambda: _env_optional("TELEGRAM_BOT_TOKEN"))
    telegram_chat_id: str | None = field(default_factory=lambda: _env_optional("TELEGRAM_CHAT_ID"))

    # --- Logging -----------------------------------------------------------
    log_level: str = field(default_factory=lambda: _env_str("KESTREL_LOG_LEVEL", "INFO"))

    @property
    def ebay_base_url(self) -> str:
        if self.ebay_env == "production":
            return "https://api.ebay.com"
        return "https://api.sandbox.ebay.com"


CONFIG = Config()
