CREATE TYPE "ClaimStatus" AS ENUM ('SUBMITTED', 'ASSESSED', 'REVIEW_REQUIRED');
CREATE TYPE "AssessmentDecision" AS ENUM ('JUSTIFIED', 'NOT_JUSTIFIED');

CREATE TABLE "Claim" (
  "id" TEXT NOT NULL,
  "claimText" TEXT NOT NULL,
  "productFormula" TEXT NOT NULL,
  "evidence" TEXT NOT NULL,
  "status" "ClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assessment" (
  "id" TEXT NOT NULL,
  "claimId" TEXT NOT NULL,
  "decision" "AssessmentDecision" NOT NULL,
  "justified" BOOLEAN NOT NULL,
  "confidence" DECIMAL(5,4) NOT NULL,
  "reasoning" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL DEFAULT 'v1',
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Claim_status_createdAt_idx" ON "Claim"("status", "createdAt");
CREATE INDEX "Assessment_claimId_createdAt_idx" ON "Assessment"("claimId", "createdAt");
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
