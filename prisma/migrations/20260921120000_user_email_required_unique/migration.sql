-- User.email becomes required and globally unique.
-- Prisma Account remains the sales tenant (Mandant), not an Auth.js OAuth Account.

UPDATE "User"
SET "email" = 'legacy-' || "id" || '@leadgreet.invalid'
WHERE "email" IS NULL OR btrim("email") = '';

ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
