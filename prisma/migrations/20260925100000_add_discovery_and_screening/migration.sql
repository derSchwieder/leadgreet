-- Discovery inbox (unresolved market signals) and manual company screening.
-- Does not change Signal, RadarProfile, AccountCompanyState, or Greet.

CREATE TYPE "UnresolvedSignalStatus" AS ENUM ('NEW', 'REVIEWED', 'RESOLVED', 'DISMISSED');
CREATE TYPE "CompanyScreeningStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "CompanyScreeningTrigger" AS ENUM ('MANUAL');

CREATE TABLE "UnresolvedSignal" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "signalType" "SignalType",
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "companyNameRaw" TEXT,
    "personNameRaw" TEXT,
    "domainRaw" TEXT,
    "locationRaw" TEXT,
    "status" "UnresolvedSignalStatus" NOT NULL DEFAULT 'NEW',
    "confidence" INTEGER,
    "resolvedCompanyId" TEXT,
    "resolvedContactId" TEXT,
    "resolvedSignalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnresolvedSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyScreening" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyId" TEXT,
    "inputName" TEXT NOT NULL,
    "inputDomain" TEXT,
    "status" "CompanyScreeningStatus" NOT NULL DEFAULT 'QUEUED',
    "triggeredBy" "CompanyScreeningTrigger" NOT NULL DEFAULT 'MANUAL',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyScreening_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyScreeningResult" (
    "id" TEXT NOT NULL,
    "screeningId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyScreeningResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UnresolvedSignal_source_externalId_key" ON "UnresolvedSignal"("source", "externalId");
CREATE INDEX "UnresolvedSignal_status_idx" ON "UnresolvedSignal"("status");
CREATE INDEX "UnresolvedSignal_detectedAt_idx" ON "UnresolvedSignal"("detectedAt");
CREATE INDEX "UnresolvedSignal_resolvedCompanyId_idx" ON "UnresolvedSignal"("resolvedCompanyId");
CREATE INDEX "UnresolvedSignal_signalType_idx" ON "UnresolvedSignal"("signalType");

CREATE INDEX "CompanyScreening_accountId_idx" ON "CompanyScreening"("accountId");
CREATE INDEX "CompanyScreening_companyId_idx" ON "CompanyScreening"("companyId");
CREATE INDEX "CompanyScreening_status_idx" ON "CompanyScreening"("status");
CREATE INDEX "CompanyScreening_accountId_status_idx" ON "CompanyScreening"("accountId", "status");

CREATE UNIQUE INDEX "CompanyScreeningResult_screeningId_key" ON "CompanyScreeningResult"("screeningId");

ALTER TABLE "UnresolvedSignal"
  ADD CONSTRAINT "UnresolvedSignal_resolvedCompanyId_fkey"
  FOREIGN KEY ("resolvedCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UnresolvedSignal"
  ADD CONSTRAINT "UnresolvedSignal_resolvedContactId_fkey"
  FOREIGN KEY ("resolvedContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UnresolvedSignal"
  ADD CONSTRAINT "UnresolvedSignal_resolvedSignalId_fkey"
  FOREIGN KEY ("resolvedSignalId") REFERENCES "Signal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompanyScreening"
  ADD CONSTRAINT "CompanyScreening_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyScreening"
  ADD CONSTRAINT "CompanyScreening_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompanyScreeningResult"
  ADD CONSTRAINT "CompanyScreeningResult_screeningId_fkey"
  FOREIGN KEY ("screeningId") REFERENCES "CompanyScreening"("id") ON DELETE CASCADE ON UPDATE CASCADE;
