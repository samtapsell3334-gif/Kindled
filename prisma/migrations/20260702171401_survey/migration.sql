-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "segment" TEXT,
    "answers" JSONB NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_sessionId_key" ON "survey_responses"("sessionId");
