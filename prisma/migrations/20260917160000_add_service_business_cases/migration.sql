-- CreateEnum
CREATE TYPE "BusinessCaseType" AS ENUM ('COST_REDUCTION', 'REVENUE_GROWTH', 'CAPACITY', 'RISK_REDUCTION');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "businessCaseTypes" "BusinessCaseType"[] DEFAULT ARRAY[]::"BusinessCaseType"[];
ALTER TABLE "Service" ADD COLUMN "valuePropositions" TEXT[] DEFAULT ARRAY[]::TEXT[];
