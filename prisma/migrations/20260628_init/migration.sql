-- ─── Kindled Phase 1 & 2 — Initial Schema ──────────────────────────────────
-- Run:  npx prisma migrate dev --name init
-- Or paste directly into Supabase → SQL Editor.
-- All monetary columns use NUMERIC(10,2) — never FLOAT.

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE "PotStatus" AS ENUM ('ACTIVE', 'HALFWAY', 'FUNDED', 'STALLED');
CREATE TYPE "PaymentMethod" AS ENUM ('OPEN_BANKING', 'CASHBACK', 'CARD');
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "GiftingMode" AS ENUM ('LIVE_FEED', 'UNDER_THE_TREE', 'WRAPPED_UP');
CREATE TYPE "ItemCategory" AS ENUM (
  'ELECTRONICS', 'FASHION', 'HOME_GARDEN', 'SPORTS_OUTDOORS',
  'BEAUTY_HEALTH', 'TOYS_GAMES', 'TRAVEL', 'EXPERIENCES', 'FOOD_DRINK', 'OTHER'
);
CREATE TYPE "RevealTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- ─── users ──────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"                    TEXT        NOT NULL,
  "phone"                 TEXT        UNIQUE,
  "email"                 TEXT        UNIQUE,
  "name"                  TEXT,
  "avatarUrl"             TEXT,
  "isRegistered"          BOOLEAN     NOT NULL DEFAULT FALSE,
  "cashbackWalletBalance" NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Stripe Connect Express account ID (host onboarding)
  "stripeAccountId"       TEXT        UNIQUE,
  -- Stripe Customer ID (giver saved cards)
  "stripeCustomerId"      TEXT        UNIQUE,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "users_phone_idx"            ON "users" ("phone");
CREATE INDEX "users_email_idx"            ON "users" ("email");
CREATE INDEX "users_isRegistered_idx"     ON "users" ("isRegistered", "createdAt");

-- ─── pots (Fires) ─────────────────────────────────────────────────────────--

CREATE TABLE "pots" (
  "id"             TEXT            NOT NULL,
  "creatorId"      TEXT            NOT NULL,
  "title"          TEXT            NOT NULL,
  "description"    TEXT,
  "targetAmount"   NUMERIC(10,2)   NOT NULL,
  "currentBalance" NUMERIC(10,2)   NOT NULL DEFAULT 0,
  "status"         "PotStatus"     NOT NULL DEFAULT 'ACTIVE',
  "mode"           "GiftingMode"   NOT NULL DEFAULT 'LIVE_FEED',
  "continuous"     BOOLEAN         NOT NULL DEFAULT TRUE,
  "eventDate"      TIMESTAMPTZ,
  "revealVideoUrl" TEXT,
  "createdAt"      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT "pots_pkey"             PRIMARY KEY ("id"),
  CONSTRAINT "pots_creatorId_fkey"   FOREIGN KEY ("creatorId") REFERENCES "users" ("id")
);

CREATE INDEX "pots_creatorId_idx"        ON "pots" ("creatorId");
CREATE INDEX "pots_status_idx"           ON "pots" ("status");
CREATE INDEX "pots_status_eventDate_idx" ON "pots" ("status", "eventDate");
CREATE INDEX "pots_creatorId_status_idx" ON "pots" ("creatorId", "status");
CREATE INDEX "pots_mode_status_idx"      ON "pots" ("mode", "status");   -- AdTech segmentation

-- ─── pot_items ───────────────────────────────────────────────────────────────

CREATE TABLE "pot_items" (
  "id"          TEXT            NOT NULL,
  "potId"       TEXT            NOT NULL,
  "productName" TEXT            NOT NULL,
  "category"    "ItemCategory"  NOT NULL,
  "price"       NUMERIC(10,2)   NOT NULL,
  "externalUrl" TEXT,
  "isSponsored" BOOLEAN         NOT NULL DEFAULT FALSE,
  "pinX"        FLOAT8,
  "pinY"        FLOAT8,
  "addedAt"     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT "pot_items_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "pot_items_potId_fkey" FOREIGN KEY ("potId") REFERENCES "pots" ("id") ON DELETE CASCADE
);

CREATE INDEX "pot_items_potId_idx"               ON "pot_items" ("potId");
CREATE INDEX "pot_items_category_idx"            ON "pot_items" ("category");
CREATE INDEX "pot_items_potId_category_idx"      ON "pot_items" ("potId", "category");
CREATE INDEX "pot_items_sponsored_category_idx"  ON "pot_items" ("isSponsored", "category");
CREATE INDEX "pot_items_sponsored_price_cat_idx" ON "pot_items" ("isSponsored", "price", "category");

-- ─── contributions (Transactions) ────────────────────────────────────────────

CREATE TABLE "contributions" (
  "id"             TEXT                 NOT NULL,
  "potId"          TEXT                 NOT NULL,
  "giverId"        TEXT,
  "amount"         NUMERIC(10,2)        NOT NULL,
  "paymentMethod"  "PaymentMethod"      NOT NULL,
  "status"         "ContributionStatus" NOT NULL DEFAULT 'PENDING',
  -- Stripe PaymentIntent ID — reconciled by webhook
  "stripeIntentId" TEXT                 UNIQUE,
  "message"        TEXT,
  "videoUrl"       TEXT,
  "createdAt"      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),

  CONSTRAINT "contributions_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "contributions_potId_fkey"  FOREIGN KEY ("potId") REFERENCES "pots" ("id"),
  CONSTRAINT "contributions_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "users" ("id")
);

CREATE INDEX "contributions_potId_idx"          ON "contributions" ("potId");
CREATE INDEX "contributions_giverId_idx"         ON "contributions" ("giverId");
CREATE INDEX "contributions_status_idx"          ON "contributions" ("status");
CREATE INDEX "contributions_potId_status_idx"    ON "contributions" ("potId", "status");
CREATE INDEX "contributions_method_status_idx"   ON "contributions" ("paymentMethod", "status");
CREATE INDEX "contributions_createdAt_status_idx" ON "contributions" ("createdAt", "status");

-- ─── intent_data_nodes (IntentLog) ───────────────────────────────────────────

CREATE TABLE "intent_data_nodes" (
  "id"                    TEXT            NOT NULL,
  "userId"                TEXT            NOT NULL,
  "potId"                 TEXT            NOT NULL,
  "potItemId"             TEXT            NOT NULL,
  "category"              "ItemCategory"  NOT NULL,
  "priceAtCapture"        NUMERIC(10,2)   NOT NULL,
  "hoursAfterPotCreation" FLOAT8          NOT NULL,
  "isExported"            BOOLEAN         NOT NULL DEFAULT FALSE,
  "exportedAt"            TIMESTAMPTZ,
  "capturedAt"            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT "intent_data_nodes_pkey"          PRIMARY KEY ("id"),
  CONSTRAINT "intent_data_nodes_userId_fkey"   FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  CONSTRAINT "intent_data_nodes_potId_fkey"    FOREIGN KEY ("potId") REFERENCES "pots" ("id"),
  CONSTRAINT "intent_data_nodes_potItemId_fkey" FOREIGN KEY ("potItemId") REFERENCES "pot_items" ("id")
);

CREATE INDEX "intent_exported_capturedAt_idx"        ON "intent_data_nodes" ("isExported", "capturedAt");
CREATE INDEX "intent_exported_category_capturedAt_idx" ON "intent_data_nodes" ("isExported", "category", "capturedAt");
CREATE INDEX "intent_userId_capturedAt_idx"           ON "intent_data_nodes" ("userId", "capturedAt");
CREATE INDEX "intent_potId_idx"                       ON "intent_data_nodes" ("potId");
CREATE INDEX "intent_category_price_idx"              ON "intent_data_nodes" ("category", "priceAtCapture");

-- ─── reveal_tasks ─────────────────────────────────────────────────────────────

CREATE TABLE "reveal_tasks" (
  "id"             TEXT               NOT NULL,
  "potId"          TEXT               NOT NULL,
  "providerTaskId" TEXT               NOT NULL UNIQUE,
  "provider"       TEXT               NOT NULL DEFAULT 'kling',
  "prompt"         TEXT               NOT NULL,
  "status"         "RevealTaskStatus" NOT NULL DEFAULT 'PENDING',
  "videoUrl"       TEXT,
  "errorPayload"   TEXT,
  "createdAt"      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT "reveal_tasks_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "reveal_tasks_potId_fkey" FOREIGN KEY ("potId") REFERENCES "pots" ("id") ON DELETE CASCADE
);

CREATE INDEX "reveal_tasks_potId_status_idx"  ON "reveal_tasks" ("potId", "status");
CREATE INDEX "reveal_tasks_status_created_idx" ON "reveal_tasks" ("status", "createdAt");

-- ─── updatedAt auto-maintenance trigger ──────────────────────────────────────
-- Postgres doesn't have auto-update for updatedAt. Attach this trigger to each table.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "users_updated_at"         BEFORE UPDATE ON "users"             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "pots_updated_at"          BEFORE UPDATE ON "pots"              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "pot_items_updated_at"     BEFORE UPDATE ON "pot_items"         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "contributions_updated_at" BEFORE UPDATE ON "contributions"     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "reveal_tasks_updated_at"  BEFORE UPDATE ON "reveal_tasks"      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
