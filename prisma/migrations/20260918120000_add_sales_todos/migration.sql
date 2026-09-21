-- CreateEnum
CREATE TYPE "SalesTodoStatus" AS ENUM ('OPEN', 'DONE');

-- CreateTable
CREATE TABLE "SalesTodo" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "SalesTodoStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "relatedActivityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTodo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesTodo_accountId_idx" ON "SalesTodo"("accountId");

-- CreateIndex
CREATE INDEX "SalesTodo_opportunityId_idx" ON "SalesTodo"("opportunityId");

-- CreateIndex
CREATE INDEX "SalesTodo_companyId_idx" ON "SalesTodo"("companyId");

-- CreateIndex
CREATE INDEX "SalesTodo_dueAt_idx" ON "SalesTodo"("dueAt");

-- CreateIndex
CREATE INDEX "SalesTodo_status_idx" ON "SalesTodo"("status");

-- AddForeignKey
ALTER TABLE "SalesTodo" ADD CONSTRAINT "SalesTodo_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTodo" ADD CONSTRAINT "SalesTodo_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTodo" ADD CONSTRAINT "SalesTodo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTodo" ADD CONSTRAINT "SalesTodo_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTodo" ADD CONSTRAINT "SalesTodo_relatedActivityId_fkey" FOREIGN KEY ("relatedActivityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
