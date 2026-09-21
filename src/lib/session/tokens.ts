import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** 32 bytes → 256 bits of entropy. */
export const SESSION_TOKEN_BYTES = 32;
/** Fixed session lifetime. Not sliding. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function sessionTokenHashMatches(token: string, storedHash: string): boolean {
  try {
    const actual = Buffer.from(hashSessionToken(token), "hex");
    const expected = Buffer.from(storedHash, "hex");
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
