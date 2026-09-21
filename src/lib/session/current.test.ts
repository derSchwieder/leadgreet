import { beforeEach, describe, expect, it, vi } from "vitest";

const { readSessionTokenFromRequest, getSessionByToken } = vi.hoisted(() => ({
  readSessionTokenFromRequest: vi.fn(),
  getSessionByToken: vi.fn(),
}));

vi.mock("./cookie", () => ({
  readSessionTokenFromRequest,
}));

vi.mock("./store", () => ({
  getSessionByToken,
}));

import { getCurrentSession } from "./current";

describe("getCurrentSession", () => {
  beforeEach(() => {
    readSessionTokenFromRequest.mockReset();
    getSessionByToken.mockReset();
  });

  it("returns null when no cookie is present", async () => {
    readSessionTokenFromRequest.mockResolvedValue(null);
    await expect(getCurrentSession()).resolves.toBeNull();
    expect(getSessionByToken).not.toHaveBeenCalled();
  });

  it("validates the cookie token against the session store", async () => {
    const resolved = {
      id: "sess-1",
      userId: "user-a",
      expiresAt: new Date(),
      createdAt: new Date(),
      lastUsedAt: null,
      revokedAt: null,
      user: {
        id: "user-a",
        accountId: "account-a",
        name: "User A",
        email: "a@leadgreet.test",
      },
    };
    readSessionTokenFromRequest.mockResolvedValue("cookie-token");
    getSessionByToken.mockResolvedValue(resolved);

    await expect(getCurrentSession()).resolves.toEqual(resolved);
    expect(getSessionByToken).toHaveBeenCalledWith("cookie-token", expect.any(Date));
  });

  it("returns null when cookie reading fails", async () => {
    readSessionTokenFromRequest.mockRejectedValue(new Error("no request scope"));
    await expect(getCurrentSession()).resolves.toBeNull();
  });
});
