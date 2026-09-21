import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession } = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getCurrentSession,
}));

const { findUnique, create, userFindFirst, userCreate, userUpdate } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  prisma: {
    account: {
      findUnique,
      create,
    },
    user: {
      findFirst: userFindFirst,
      create: userCreate,
      update: userUpdate,
    },
  },
}));

import { getCurrentAccountId } from "@/lib/db/accounts";
import { getCurrentUser } from "@/lib/db/current-user";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "@/lib/db/users";

const demoUser = {
  id: "user-demo",
  accountId: "account-demo",
  name: DEMO_USER_NAME,
  email: DEMO_USER_EMAIL,
};

const sessionUser = {
  id: "user-real",
  accountId: "account-real",
  name: "Ada Lovelace",
  email: "ada@leadgreet.test",
};

describe("session identity", () => {
  beforeEach(() => {
    getCurrentSession.mockReset();
    findUnique.mockReset();
    create.mockReset();
    userFindFirst.mockReset();
    userCreate.mockReset();
    userUpdate.mockReset();
    findUnique.mockResolvedValue({ id: "account-demo", slug: "demo" });
    userFindFirst.mockResolvedValue(demoUser);
    getCurrentSession.mockResolvedValue(null);
  });

  it("keeps the demo fallback when no session is present", async () => {
    await expect(getCurrentUser()).resolves.toEqual(demoUser);
    await expect(getCurrentAccountId()).resolves.toBe("account-demo");
    expect(userFindFirst).toHaveBeenCalled();
  });

  it("uses the session user and that user's account", async () => {
    getCurrentSession.mockResolvedValue({
      id: "sess-1",
      userId: sessionUser.id,
      expiresAt: new Date("2026-10-21T00:00:00.000Z"),
      createdAt: new Date("2026-09-21T00:00:00.000Z"),
      lastUsedAt: new Date("2026-09-21T00:00:00.000Z"),
      revokedAt: null,
      user: sessionUser,
    });

    await expect(getCurrentUser()).resolves.toEqual(sessionUser);
    await expect(getCurrentAccountId()).resolves.toBe("account-real");
    expect(userFindFirst).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("cannot switch the tenant via a foreign account id", async () => {
    getCurrentSession.mockResolvedValue({
      id: "sess-1",
      userId: sessionUser.id,
      expiresAt: new Date("2026-10-21T00:00:00.000Z"),
      createdAt: new Date("2026-09-21T00:00:00.000Z"),
      lastUsedAt: null,
      revokedAt: null,
      user: sessionUser,
    });

    const user = await getCurrentUser();
    expect(user.accountId).toBe(sessionUser.accountId);
    expect(user.accountId).not.toBe("account-injected");
    expect(await getCurrentAccountId()).toBe(sessionUser.accountId);
    expect(getCurrentAccountId).toHaveLength(0);
  });
});
