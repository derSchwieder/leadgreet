import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_LENGTH = 8;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const MAX_OTP_ATTEMPTS = 5;

const OTP_RANGE = 10 ** OTP_LENGTH;

export function normalizeOtpEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtpCode(): string {
  return randomInt(0, OTP_RANGE).toString().padStart(OTP_LENGTH, "0");
}

export function isOtpCodeFormat(code: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code);
}

export function hashOtpCode(code: string): string {
  const salt = randomBytes(16);
  const digest = createHmac("sha256", salt).update(code, "utf8").digest();
  return `${salt.toString("hex")}:${digest.toString("hex")}`;
}

export function otpHashMatches(code: string, storedHash: string): boolean {
  const separator = storedHash.indexOf(":");
  if (separator <= 0) return false;
  const saltHex = storedHash.slice(0, separator);
  const digestHex = storedHash.slice(separator + 1);
  if (!saltHex || !digestHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(digestHex, "hex");
    const actual = createHmac("sha256", salt).update(code, "utf8").digest();
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
