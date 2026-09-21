import { describe, expect, it } from "vitest";
import {
  consumeRateLimit,
  OTP_REQUESTS_PER_EMAIL,
  RateLimitError,
  consumeAuthRateLimit,
} from "./rate-limit";

describe("auth rate limit", () => {
  it("allows up to max attempts inside the window and then rejects", () => {
    const key = `bucket-${crypto.randomUUID()}`;
    for (let i = 0; i < OTP_REQUESTS_PER_EMAIL; i += 1) {
      expect(consumeRateLimit(key, OTP_REQUESTS_PER_EMAIL)).toBe(true);
    }
    expect(consumeRateLimit(key, OTP_REQUESTS_PER_EMAIL)).toBe(false);
    expect(() => consumeAuthRateLimit(`throw-${crypto.randomUUID()}`, 0)).toThrow(RateLimitError);
  });
});
