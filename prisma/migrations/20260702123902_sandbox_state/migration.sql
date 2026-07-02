-- CreateEnum
CREATE TYPE "MilestoneCategory" AS ENUM ('EXPEDITION', 'FOUNDATION', 'CELEBRATION', 'LEGACY');

-- CreateEnum
CREATE TYPE "ItemClaimStatus" AS ENUM ('AVAILABLE', 'PENDING', 'CLAIMED');

-- DropForeignKey
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_giverId_fkey";

-- DropForeignKey
ALTER TABLE "contributions" DROP CONSTRAINT "contributions_potId_fkey";

-- DropForeignKey
ALTER TABLE "intent_data_nodes" DROP CONSTRAINT "intent_data_nodes_potId_fkey";

-- DropForeignKey
ALTER TABLE "intent_data_nodes" DROP CONSTRAINT "intent_data_nodes_potItemId_fkey";

-- DropForeignKey
ALTER TABLE "intent_data_nodes" DROP CONSTRAINT "intent_data_nodes_userId_fkey";

-- DropForeignKey
ALTER TABLE "kindle_memories" DROP CONSTRAINT "kindle_memories_contributionId_fkey";

-- DropForeignKey
ALTER TABLE "pot_items" DROP CONSTRAINT "pot_items_potId_fkey";

-- DropForeignKey
ALTER TABLE "pots" DROP CONSTRAINT "pots_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "reveal_tasks" DROP CONSTRAINT "reveal_tasks_potId_fkey";

-- AlterTable
ALTER TABLE "contributions" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "intent_data_nodes" ALTER COLUMN "exportedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "capturedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "kindle_memories" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pot_items" ADD COLUMN     "claimStatus" "ItemClaimStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedByUserId" TEXT,
ADD COLUMN     "reservedUntil" TIMESTAMP(3),
ALTER COLUMN "addedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pots" ADD COLUMN     "isJoint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedUserId" TEXT,
ADD COLUMN     "milestoneCategory" "MilestoneCategory",
ADD COLUMN     "starCount" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "targetMilestoneDate" TIMESTAMP(3),
ALTER COLUMN "eventDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reveal_tasks" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "behaviors" (
    "id" TEXT NOT NULL,
    "potId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starsAwarded" INTEGER NOT NULL DEFAULT 1,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "star_awards" (
    "id" TEXT NOT NULL,
    "potId" TEXT NOT NULL,
    "behaviorId" TEXT,
    "behaviorDescription" TEXT NOT NULL,
    "starsAwarded" INTEGER NOT NULL,
    "valueAdded" DECIMAL(10,2) NOT NULL,
    "starIndexStart" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "star_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sandbox_state" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sandbox_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "behaviors_potId_enabled_idx" ON "behaviors"("potId", "enabled");

-- CreateIndex
CREATE INDEX "star_awards_potId_createdAt_idx" ON "star_awards"("potId", "createdAt");

-- CreateIndex
CREATE INDEX "pot_items_potId_claimStatus_idx" ON "pot_items"("potId", "claimStatus");

-- CreateIndex
CREATE INDEX "pot_items_claimStatus_reservedUntil_idx" ON "pot_items"("claimStatus", "reservedUntil");

-- CreateIndex
CREATE INDEX "pots_isJoint_linkedUserId_idx" ON "pots"("isJoint", "linkedUserId");

-- AddForeignKey
ALTER TABLE "pots" ADD CONSTRAINT "pots_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pots" ADD CONSTRAINT "pots_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behaviors" ADD CONSTRAINT "behaviors_potId_fkey" FOREIGN KEY ("potId") REFERENCES "pots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "star_awards" ADD CONSTRAINT "star_awards_potId_fkey" FOREIGN KEY ("potId") REFERENCES "pots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "star_awards" ADD CONSTRAINT "star_awards_behaviorId_fkey" FOREIGN KEY ("behaviorId") REFERENCES "behaviors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reveal_tasks" ADD CONSTRAINT "reveal_tasks_potId_fkey" FOREIGN KEY ("potId") REFERENCES "pots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pot_items" ADD CONSTRAINT "pot_items_potId_fkey" FOREIGN KEY ("potId") REFERENCES "pots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pot_items" ADD CONSTRAINT "pot_items_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_potId_fkey" FOREIGN KEY ("potId") REFERENCES "pots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kindle_memories" ADD CONSTRAINT "kindle_memories_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_data_nodes" ADD CONSTRAINT "intent_data_nodes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_data_nodes" ADD CONSTRAINT "intent_data_nodes_potId_fkey" FOREIGN KEY ("potId") REFERENCES "pots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intent_data_nodes" ADD CONSTRAINT "intent_data_nodes_potItemId_fkey" FOREIGN KEY ("potItemId") REFERENCES "pot_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "contributions_method_status_idx" RENAME TO "contributions_paymentMethod_status_idx";

-- RenameIndex
ALTER INDEX "intent_category_price_idx" RENAME TO "intent_data_nodes_category_priceAtCapture_idx";

-- RenameIndex
ALTER INDEX "intent_exported_capturedAt_idx" RENAME TO "intent_data_nodes_isExported_capturedAt_idx";

-- RenameIndex
ALTER INDEX "intent_exported_category_capturedAt_idx" RENAME TO "intent_data_nodes_isExported_category_capturedAt_idx";

-- RenameIndex
ALTER INDEX "intent_potId_idx" RENAME TO "intent_data_nodes_potId_idx";

-- RenameIndex
ALTER INDEX "intent_userId_capturedAt_idx" RENAME TO "intent_data_nodes_userId_capturedAt_idx";

-- RenameIndex
ALTER INDEX "pot_items_sponsored_category_idx" RENAME TO "pot_items_isSponsored_category_idx";

-- RenameIndex
ALTER INDEX "pot_items_sponsored_price_cat_idx" RENAME TO "pot_items_isSponsored_price_category_idx";

-- RenameIndex
ALTER INDEX "reveal_tasks_status_created_idx" RENAME TO "reveal_tasks_status_createdAt_idx";

-- RenameIndex
ALTER INDEX "users_isRegistered_idx" RENAME TO "users_isRegistered_createdAt_idx";
