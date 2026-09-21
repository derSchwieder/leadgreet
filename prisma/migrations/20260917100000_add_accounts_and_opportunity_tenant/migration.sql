-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_slug_key" ON "Account"("slug");

-- CreateIndex
CREATE INDEX "User_accountId_idx" ON "User"("accountId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN "accountId" TEXT;

-- Transitional demo tenant for existing opportunities. Not authentication.
INSERT INTO "Account" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('cmtxdemoaccount00000000001', 'Demo Account', 'demo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "Opportunity"
SET "accountId" = (SELECT "id" FROM "Account" WHERE "slug" = 'demo')
WHERE "accountId" IS NULL;

ALTER TABLE "Opportunity" ALTER COLUMN "accountId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Opportunity_accountId_idx" ON "Opportunity"("accountId");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
