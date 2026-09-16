-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('AI_PROJECT', 'AI_STRATEGY', 'AI_RECRUITING', 'AI_AGENT', 'GENAI', 'CLOUD_MIGRATION', 'DATA_PLATFORM', 'DATA_ANALYTICS', 'ERP_TRANSFORMATION', 'SOFTWARE_MODERNIZATION', 'PROCESS_AUTOMATION', 'DIGITAL_TRANSFORMATION', 'IT_REORGANIZATION', 'NEW_CIO', 'NEW_CTO', 'NEW_CDO', 'NEW_INNOVATION_LEAD', 'EXPANSION', 'INVESTMENT', 'FUNDING', 'M_AND_A', 'IT_RECRUITING', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('CEO', 'MANAGING_DIRECTOR', 'CIO', 'CTO', 'CDO', 'HEAD_OF_IT', 'HEAD_OF_DIGITALIZATION', 'HEAD_OF_INNOVATION', 'HEAD_OF_DATA', 'HEAD_OF_AI', 'HEAD_OF_TRANSFORMATION', 'HEAD_OF_SOFTWARE', 'COO', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('COMPANY_WEBSITE', 'PRESS_RELEASE', 'NEWS', 'JOB_POSTING', 'ANNUAL_REPORT', 'FUNDING', 'PUBLIC_TENDER', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('NEW', 'REVIEWED', 'QUALIFIED', 'CONTACTED', 'MEETING', 'OPPORTUNITY', 'WON', 'LOST', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('NEW', 'REVIEWED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "subIndustry" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "employees" INTEGER,
    "revenue" DECIMAL(18,2),
    "revenueCurrency" TEXT,
    "revenueYear" INTEGER,
    "companySize" "CompanySize",
    "ownership" TEXT,
    "description" TEXT,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3),
    "credibilityScore" INTEGER NOT NULL DEFAULT 50,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "eventDate" TIMESTAMP(3),
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "signalStrength" INTEGER NOT NULL,
    "freshnessScore" INTEGER NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "confidenceScore" INTEGER NOT NULL,
    "status" "SignalStatus" NOT NULL DEFAULT 'NEW',
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "sourceUrl" TEXT,
    "confidenceScore" INTEGER NOT NULL,
    "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "recommendedApproach" TEXT,
    "whyNow" TEXT,
    "opportunityScore" INTEGER NOT NULL,
    "signalStrength" INTEGER NOT NULL,
    "companyFit" INTEGER NOT NULL,
    "contactFit" INTEGER NOT NULL,
    "freshness" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'NEW',
    "recommendedContactId" TEXT,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreBreakdown" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "signalStrength" INTEGER NOT NULL,
    "freshness" INTEGER NOT NULL,
    "companyFit" INTEGER NOT NULL,
    "contactFit" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OpportunitySignals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunitySignals_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_isSeed_idx" ON "Company"("isSeed");

-- CreateIndex
CREATE INDEX "Source_sourceType_idx" ON "Source"("sourceType");

-- CreateIndex
CREATE INDEX "Source_isSeed_idx" ON "Source"("isSeed");

-- CreateIndex
CREATE INDEX "Signal_companyId_idx" ON "Signal"("companyId");

-- CreateIndex
CREATE INDEX "Signal_type_idx" ON "Signal"("type");

-- CreateIndex
CREATE INDEX "Signal_detectedAt_idx" ON "Signal"("detectedAt");

-- CreateIndex
CREATE INDEX "Signal_status_idx" ON "Signal"("status");

-- CreateIndex
CREATE INDEX "Signal_isSeed_idx" ON "Signal"("isSeed");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Contact_role_idx" ON "Contact"("role");

-- CreateIndex
CREATE INDEX "Contact_isSeed_idx" ON "Contact"("isSeed");

-- CreateIndex
CREATE INDEX "Opportunity_companyId_idx" ON "Opportunity"("companyId");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "Opportunity_opportunityScore_idx" ON "Opportunity"("opportunityScore");

-- CreateIndex
CREATE INDEX "Opportunity_isSeed_idx" ON "Opportunity"("isSeed");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreBreakdown_opportunityId_key" ON "ScoreBreakdown"("opportunityId");

-- CreateIndex
CREATE INDEX "_OpportunitySignals_B_index" ON "_OpportunitySignals"("B");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_recommendedContactId_fkey" FOREIGN KEY ("recommendedContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreBreakdown" ADD CONSTRAINT "ScoreBreakdown_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunitySignals" ADD CONSTRAINT "_OpportunitySignals_A_fkey" FOREIGN KEY ("A") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunitySignals" ADD CONSTRAINT "_OpportunitySignals_B_fkey" FOREIGN KEY ("B") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

