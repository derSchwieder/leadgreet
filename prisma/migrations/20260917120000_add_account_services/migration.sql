-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetCompanySizes" "CompanySize"[] DEFAULT ARRAY[]::"CompanySize"[],
    "targetRoles" "ContactRole"[] DEFAULT ARRAY[]::"ContactRole"[],
    "matchingSignalTypes" "SignalType"[] DEFAULT ARRAY[]::"SignalType"[],
    "conversationStarter" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Service_accountId_idx" ON "Service"("accountId");

-- CreateIndex
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
