import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOGIN_OTP_REQUESTED_MESSAGE } from "@/lib/auth/login";
import { RateLimitError } from "@/lib/auth/rate-limit";

const { requestLoginOtp } = vi.hoisted(() => ({
  requestLoginOtp: vi.fn(),
}));

vi.mock("@/lib/auth/login", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/login")>("@/lib/auth/login");
  return {
    ...actual,
    requestLoginOtp,
  };
});

import { POST } from "./route";

describe("POST /api/auth/otp", () => {
  beforeEach(() => {
    requestLoginOtp.mockReset();
  });

  it("requests an OTP and returns the generic message", async () => {
    requestLoginOtp.mockResolvedValue({
      message: LOGIN_OTP_REQUESTED_MESSAGE,
      developmentOtp: "12345678",
    });

    const response = await POST(
      new Request("http://localhost/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.10" },
        body: JSON.stringify({ email: "Ada@Leadgreet.test", accountId: "account-other" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(requestLoginOtp).toHaveBeenCalledWith({
      email: "Ada@Leadgreet.test",
      ip: "203.0.113.10",
    });
    expect(body.ok).toBe(true);
    expect(body.message).toBe(LOGIN_OTP_REQUESTED_MESSAGE);
    expect(body.developmentOtp).toBe("12345678");
    expect(body).not.toHaveProperty("accountId");
    expect(body).not.toHaveProperty("user");
  });

  it("returns the same success contract when the helper hides the user", async () => {
    requestLoginOtp.mockResolvedValue({ message: LOGIN_OTP_REQUESTED_MESSAGE });

    const response = await POST(
      new Request("http://localhost/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "missing@leadgreet.test" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, message: LOGIN_OTP_REQUESTED_MESSAGE });
  });

  it("rejects invalid email without creating an OTP", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(requestLoginOtp).not.toHaveBeenCalled();
  });

  it("maps rate limiting to 429", async () => {
    requestLoginOtp.mockRejectedValue(new RateLimitError());
    const response = await POST(
      new Request("http://localhost/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ada@leadgreet.test" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe("Bitte später erneut versuchen.");
  });
});
