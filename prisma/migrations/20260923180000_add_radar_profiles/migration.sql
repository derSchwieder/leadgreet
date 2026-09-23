-- Multi-radar profiles and tenant-private company exclusion.
-- Account.icp is kept as a deprecated fallback.

CREATE TYPE "AccountCompanyStatus" AS ENUM ('NOT_RELEVANT', 'DECLINED');

CREATE TABLE "RadarProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minEmployees" INTEGER,
    "minRevenue" DECIMAL(18,2),
    "greetThreshold" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadarProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountCompanyState" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "AccountCompanyStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountCompanyState_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RadarProfile_accountId_idx" ON "RadarProfile"("accountId");
CREATE INDEX "RadarProfile_accountId_isActive_idx" ON "RadarProfile"("accountId", "isActive");
CREATE UNIQUE INDEX "AccountCompanyState_accountId_companyId_key" ON "AccountCompanyState"("accountId", "companyId");
CREATE INDEX "AccountCompanyState_accountId_idx" ON "AccountCompanyState"("accountId");
CREATE INDEX "AccountCompanyState_companyId_idx" ON "AccountCompanyState"("companyId");
CREATE INDEX "AccountCompanyState_accountId_status_idx" ON "AccountCompanyState"("accountId", "status");

ALTER TABLE "RadarProfile"
  ADD CONSTRAINT "RadarProfile_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountCompanyState"
  ADD CONSTRAINT "AccountCompanyState_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountCompanyState"
  ADD CONSTRAINT "AccountCompanyState_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One profile per existing account. Empty icp becomes an empty active radar.
INSERT INTO "RadarProfile" (
  "id",
  "accountId",
  "name",
  "industries",
  "countries",
  "minEmployees",
  "minRevenue",
  "greetThreshold",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('radar_', "id"),
  "id",
  'Mein Radar',
  CASE
    WHEN jsonb_typeof("icp"->'industries') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text("icp"->'industries'))
    ELSE ARRAY[]::TEXT[]
  END,
  CASE
    WHEN jsonb_typeof("icp"->'countries') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text("icp"->'countries'))
    ELSE ARRAY[]::TEXT[]
  END,
  CASE
    WHEN ("icp"->>'minEmployees') ~ '^[0-9]+$' THEN ("icp"->>'minEmployees')::INTEGER
    ELSE NULL
  END,
  CASE
    WHEN ("icp"->>'minRevenue') ~ '^[0-9]+(\.[0-9]+)?$' THEN ("icp"->>'minRevenue')::DECIMAL(18,2)
    ELSE NULL
  END,
  0,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Account";
