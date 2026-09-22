-- Tenant-private signal ratings. Does not change Company-Greet or Chance.
-- Public Signal rows stay global; feedback is scoped to Account + User.

CREATE TYPE "SignalFeedbackReason" AS ENUM (
    'FITS_PORTFOLIO',
    'CONCRETE_NEED',
    'GOOD_SALES_TRIGGER',
    'TOO_OLD',
    'NO_CONCRETE_NEED',
    'WRONG_CONTEXT',
    'NOT_IN_PORTFOLIO',
    'OTHER'
);

CREATE TABLE "SignalFeedback" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relevant" BOOLEAN NOT NULL,
    "reason" "SignalFeedbackReason",
    "greetScore" INTEGER NOT NULL,
    "signalStrength" INTEGER NOT NULL,
    "freshness" INTEGER NOT NULL,
    "companyFit" INTEGER NOT NULL,
    "contactFit" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "serviceFit" INTEGER,
    "businessCase" TEXT,
    "scoringWeights" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignalFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignalFeedback_accountId_userId_signalId_key" ON "SignalFeedback"("accountId", "userId", "signalId");
CREATE INDEX "SignalFeedback_accountId_idx" ON "SignalFeedback"("accountId");
CREATE INDEX "SignalFeedback_companyId_idx" ON "SignalFeedback"("companyId");
CREATE INDEX "SignalFeedback_signalId_idx" ON "SignalFeedback"("signalId");
CREATE INDEX "SignalFeedback_userId_idx" ON "SignalFeedback"("userId");

ALTER TABLE "SignalFeedback" ADD CONSTRAINT "SignalFeedback_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalFeedback" ADD CONSTRAINT "SignalFeedback_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalFeedback" ADD CONSTRAINT "SignalFeedback_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalFeedback" ADD CONSTRAINT "SignalFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
