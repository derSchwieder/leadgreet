-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EMAIL_SENT', 'EMAIL_RECEIVED', 'CALL', 'MEETING', 'NOTE', 'FOLLOW_UP', 'STATUS_CHANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityOutcome" AS ENUM ('NO_RESPONSE', 'RESPONSE_RECEIVED', 'CALLBACK_RECEIVED', 'INTERESTED', 'NOT_INTERESTED', 'MEETING_AGREED', 'FOLLOW_UP_LATER', 'NOT_REACHABLE', 'OTHER');

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "userId" TEXT,
    "type" "ActivityType" NOT NULL,
    "subject" TEXT,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "outcome" "ActivityOutcome",
    "outcomeNote" TEXT,
    "responseToActivityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityStatusHistory" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromStatus" "OpportunityStatus",
    "toStatus" "OpportunityStatus" NOT NULL,
    "userId" TEXT,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_accountId_idx" ON "Activity"("accountId");

-- CreateIndex
CREATE INDEX "Activity_opportunityId_idx" ON "Activity"("opportunityId");

-- CreateIndex
CREATE INDEX "Activity_companyId_idx" ON "Activity"("companyId");

-- CreateIndex
CREATE INDEX "Activity_occurredAt_idx" ON "Activity"("occurredAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_responseToActivityId_idx" ON "Activity"("responseToActivityId");

-- CreateIndex
CREATE INDEX "OpportunityStatusHistory_accountId_idx" ON "OpportunityStatusHistory"("accountId");

-- CreateIndex
CREATE INDEX "OpportunityStatusHistory_opportunityId_idx" ON "OpportunityStatusHistory"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityStatusHistory_changedAt_idx" ON "OpportunityStatusHistory"("changedAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_responseToActivityId_fkey" FOREIGN KEY ("responseToActivityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStatusHistory" ADD CONSTRAINT "OpportunityStatusHistory_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStatusHistory" ADD CONSTRAINT "OpportunityStatusHistory_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStatusHistory" ADD CONSTRAINT "OpportunityStatusHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
