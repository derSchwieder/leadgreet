-- Session stores hashed browser session tokens for a sales-tenant User.
-- Prisma Account remains the Mandant; this is not an Auth.js session table.
-- Existing sales data is unchanged.

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
