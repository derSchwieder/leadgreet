import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, create, userFindFirst, userCreate, userUpdate } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("./client", () => ({
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

import { DEMO_ACCOUNT_SLUG, getCurrentAccountId, getDemoAccountId } from "./accounts";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "./users";

const demoUser = {
  id: "user-demo",
  accountId: "account-demo",
  name: DEMO_USER_NAME,
  email: DEMO_USER_EMAIL,
};

describe("getCurrentAccountId", () => {
  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
    userFindFirst.mockReset();
    userCreate.mockReset();
    userUpdate.mockReset();
    findUnique.mockResolvedValue({ id: "account-demo", slug: DEMO_ACCOUNT_SLUG });
    userFindFirst.mockResolvedValue(demoUser);
  });

  it("currently resolves to the demo account fallback", async () => {
    await expect(getCurrentAccountId()).resolves.toBe("account-demo");
    await expect(getDemoAccountId()).resolves.toBe("account-demo");
    expect(findUnique).toHaveBeenCalledWith({ where: { slug: DEMO_ACCOUNT_SLUG } });
    expect(create).not.toHaveBeenCalled();
  });

  it("uses the current user's accountId when a demo user exists", async () => {
    await expect(getCurrentAccountId()).resolves.toBe(demoUser.accountId);
    expect(userFindFirst).toHaveBeenCalled();
    expect(userCreate).not.toHaveBeenCalled();
  });
});
