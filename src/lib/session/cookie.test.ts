import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyClearedSessionCookie,
  applySessionCookie,
  clearSessionCookie,
  readSessionTokenFromRequest,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_PATH,
  SESSION_COOKIE_SAMESITE,
  sessionCookieAttributes,
  setSessionCookie,
} from "./cookie";
import { SESSION_TTL_MS } from "./tokens";

const { cookieGet, cookieSet } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: cookieGet,
    set: cookieSet,
  }),
}));

describe("session cookie", () => {
  const now = new Date("2026-09-21T10:00:00.000Z");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const attrs = sessionCookieAttributes(expiresAt, now, "development");

  beforeEach(() => {
    cookieGet.mockReset();
    cookieSet.mockReset();
  });

  it("sets HttpOnly, SameSite, path, and expiry", () => {
    expect(SESSION_COOKIE_NAME).toBe("leadgreet_session");
    expect(attrs.httpOnly).toBe(true);
    expect(attrs.sameSite).toBe(SESSION_COOKIE_SAMESITE);
    expect(attrs.sameSite).toBe("lax");
    expect(attrs.path).toBe(SESSION_COOKIE_PATH);
    expect(attrs.path).toBe("/");
    expect(attrs.expires).toEqual(expiresAt);
    expect(attrs.maxAge).toBe(SESSION_TTL_MS / 1000);
    expect(attrs.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("sets Secure only in production", () => {
    expect(sessionCookieAttributes(expiresAt, now, "development").secure).toBe(false);
    expect(sessionCookieAttributes(expiresAt, now, "test").secure).toBe(false);
    expect(sessionCookieAttributes(expiresAt, now, "production").secure).toBe(true);
  });

  it("writes and reads the session cookie with the security attributes", async () => {
    await setSessionCookie("session-token-value", expiresAt);
    expect(cookieSet).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "session-token-value",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      }),
    );

    cookieGet.mockReturnValue({ name: SESSION_COOKIE_NAME, value: "session-token-value" });
    await expect(readSessionTokenFromRequest()).resolves.toBe("session-token-value");
  });

  it("clears the session cookie", async () => {
    await clearSessionCookie();
    expect(cookieSet).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({ httpOnly: true, path: "/", maxAge: 0 }),
    );
  });

  it("applies and clears the cookie on a response", async () => {
    const { NextResponse } = await import("next/server");
    const response = NextResponse.json({ ok: true });
    applySessionCookie(response, "session-token-value", expiresAt, now, "production");
    const header = response.headers.get("set-cookie") ?? "";
    expect(header).toContain(`${SESSION_COOKIE_NAME}=session-token-value`);
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/Secure/i);
    expect(header).toMatch(/Path=\//i);
    expect(header).toMatch(/SameSite=Lax/i);
    expect(header).toMatch(/Max-Age=2592000/i);

    const cleared = NextResponse.json({ ok: true });
    applyClearedSessionCookie(cleared, "development");
    expect(cleared.headers.get("set-cookie") ?? "").toMatch(/Max-Age=0/i);
  });
});
