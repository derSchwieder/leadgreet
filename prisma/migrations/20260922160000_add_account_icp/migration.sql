-- Tenant ICP profile on Account. Does not change Company-Greet or Chance.

ALTER TABLE "Account" ADD COLUMN "icp" JSONB;
