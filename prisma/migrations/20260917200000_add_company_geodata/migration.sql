-- AlterTable
ALTER TABLE "Company" ADD COLUMN "geocodedAt" TIMESTAMP(3),
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7);
