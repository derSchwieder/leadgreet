-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('PRESENTATION', 'ONE_PAGER', 'CASE_STUDY', 'WHITEPAPER', 'REFERENCE', 'PRODUCT_DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ContentType" NOT NULL,
    "url" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "businessCaseTypes" "BusinessCaseType"[] DEFAULT ARRAY[]::"BusinessCaseType"[],
    "targetRoles" "ContactRole"[] DEFAULT ARRAY[]::"ContactRole"[],
    "targetCompanySizes" "CompanySize"[] DEFAULT ARRAY[]::"CompanySize"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContentItemToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ContentItem_accountId_idx" ON "ContentItem"("accountId");

-- CreateIndex
CREATE INDEX "ContentItem_isActive_idx" ON "ContentItem"("isActive");

-- CreateIndex
CREATE INDEX "ContentItem_type_idx" ON "ContentItem"("type");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentItemToService_AB_unique" ON "_ContentItemToService"("A", "B");

-- CreateIndex
CREATE INDEX "_ContentItemToService_B_index" ON "_ContentItemToService"("B");

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentItemToService" ADD CONSTRAINT "_ContentItemToService_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentItemToService" ADD CONSTRAINT "_ContentItemToService_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
