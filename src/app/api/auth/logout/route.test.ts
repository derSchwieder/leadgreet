import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const { logoutCurrentSession } = vi.hoisted(() => ({
  logoutCurrentSession: vi.fn(),
}));

vi.mock("@/lib/auth/login", () => ({
  logoutCurrentSession,
}));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    logoutCurrentSession.mockReset();
    logoutCurrentSession.mockResolvedValue({ revoked: true });
  });

  it("revokes the session and clears the cookie", async () => {
    const response = await POST();
    const body = await response.json();
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(logoutCurrentSession).toHaveBeenCalledOnce();
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cookie).toMatch(/Max-Age=0/i);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\//i);
  });

  it("still clears the cookie when no session was present", async () => {
    logoutCurrentSession.mockResolvedValue({ revoked: false });
    const response = await POST();
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie") ?? "").toMatch(/Max-Age=0/i);
  });
});
