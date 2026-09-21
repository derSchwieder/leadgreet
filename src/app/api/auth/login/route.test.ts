import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/session";

const LOGIN_OTP_INVALID_MESSAGE = "Einmal-Code ungültig oder abgelaufen.";

const { completeLogin } = vi.hoisted(() => ({
  completeLogin: vi.fn(),
}));

vi.mock("@/lib/auth/login", () => ({
  completeLogin,
}));

import { POST } from "./route";

function setCookieHeader(response: Response): string {
  return response.headers.get("set-cookie") ?? "";
}

describe("POST /api/auth/login", () => {
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_TTL_MS);

  beforeEach(() => {
    completeLogin.mockReset();
  });

  it("sets the HttpOnly session cookie and does not return the token", async () => {
    completeLogin.mockResolvedValue({
      ok: true,
      session: {
        id: "sess-1",
        userId: "user-a",
        token: "session-token-secret",
        expiresAt,
        createdAt: new Date(now),
        lastUsedAt: new Date(now),
        revokedAt: null,
        user: {
          id: "user-a",
          accountId: "account-a",
          name: "Ada Lovelace",
          email: "ada@leadgreet.test",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "Ada@Leadgreet.test",
          otp: "12345678",
          accountId: "account-injected",
        }),
      }),
    );
    const body = await response.json();
    const cookie = setCookieHeader(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(JSON.stringify(body)).not.toContain("session-token-secret");
    expect(body).not.toHaveProperty("accountId");
    expect(body).not.toHaveProperty("token");
    expect(completeLogin).toHaveBeenCalledWith({
      email: "Ada@Leadgreet.test",
      otp: "12345678",
      ip: "unknown",
    });
    expect(completeLogin.mock.calls[0]?.[0]).not.toHaveProperty("accountId");

    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=session-token-secret`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\//i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    const maxAge = Number(cookie.match(/Max-Age=(\d+)/i)?.[1]);
    expect(maxAge).toBeGreaterThan(SESSION_TTL_MS / 1000 - 60);
    expect(maxAge).toBeLessThanOrEqual(SESSION_TTL_MS / 1000);
  });

  it("sets Secure on the session cookie in production", async () => {
    completeLogin.mockResolvedValue({
      ok: true,
      session: {
        id: "sess-1",
        userId: "user-a",
        token: "session-token-secret",
        expiresAt,
        createdAt: expiresAt,
        lastUsedAt: expiresAt,
        revokedAt: null,
        user: {
          id: "user-a",
          accountId: "account-a",
          name: "Ada",
          email: "ada@leadgreet.test",
        },
      },
    });

    vi.stubEnv("NODE_ENV", "production");
    try {
      const response = await POST(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "ada@leadgreet.test", otp: "12345678" }),
        }),
      );
      expect(setCookieHeader(response)).toMatch(/Secure/i);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rejects an invalid OTP without setting a session cookie", async () => {
    completeLogin.mockResolvedValue({ ok: false, message: LOGIN_OTP_INVALID_MESSAGE });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ada@leadgreet.test", otp: "00000000" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: LOGIN_OTP_INVALID_MESSAGE });
    expect(setCookieHeader(response)).toBe("");
  });
});
