import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  generateOtpCode,
  hashOtpCode,
  isOtpCodeFormat,
  OTP_LENGTH,
  otpHashMatches,
} from "./codes";

vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return {
    ...actual,
    randomInt: vi.fn(actual.randomInt),
  };
});

describe("OTP codes", () => {
  it("generates an 8-digit numeric code", () => {
    const code = generateOtpCode();
    expect(code).toHaveLength(OTP_LENGTH);
    expect(code).toMatch(/^\d{8}$/);
    expect(isOtpCodeFormat(code)).toBe(true);
  });

  it("uses crypto.randomInt rather than Math.random", () => {
    generateOtpCode();
    expect(randomInt).toHaveBeenCalled();
    expect(randomInt).toHaveBeenCalledWith(0, 100_000_000);

    const source = readFileSync(join(process.cwd(), "src/lib/otp/codes.ts"), "utf8");
    expect(source).toContain("randomInt");
    expect(source).not.toContain("Math.random");
  });

  it("stores a salted hash that does not contain the plaintext code", () => {
    const code = "12345678";
    const stored = hashOtpCode(code);
    expect(stored).not.toBe(code);
    expect(stored).not.toContain(code);
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    expect(otpHashMatches(code, stored)).toBe(true);
    expect(otpHashMatches("87654321", stored)).toBe(false);
    expect(otpHashMatches(code, "not-a-hash")).toBe(false);
  });
});
