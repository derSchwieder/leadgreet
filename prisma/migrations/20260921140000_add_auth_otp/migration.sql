-- AuthOtp stores hashed one-time login codes for a sales-tenant User email.
-- Prisma Account remains the Mandant; this is not an Auth.js OAuth/session table.
-- Existing sales data is unchanged.

CREATE TABLE "AuthOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthOtp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthOtp_email_idx" ON "AuthOtp"("email");

CREATE INDEX "AuthOtp_userId_idx" ON "AuthOtp"("userId");

CREATE INDEX "AuthOtp_expiresAt_idx" ON "AuthOtp"("expiresAt");

ALTER TABLE "AuthOtp" ADD CONSTRAINT "AuthOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
