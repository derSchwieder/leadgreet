import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNT_SLUG, getCurrentAccountId, getDemoAccountId } from "./accounts";
import { prisma } from "./client";
import { getCurrentUser } from "./current-user";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "./users";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("getCurrentUser", () => {
  it("returns the demo user on the demo account in demo mode", async () => {
    const user = await getCurrentUser();
    const demoAccountId = await getDemoAccountId();

    expect(user.email).toBe(DEMO_USER_EMAIL);
    expect(user.name).toBe(DEMO_USER_NAME);
    expect(user.accountId).toBe(demoAccountId);
    expect(await getCurrentAccountId()).toBe(user.accountId);

    const account = await prisma.account.findUnique({ where: { id: user.accountId } });
    expect(account?.slug).toBe(DEMO_ACCOUNT_SLUG);
  });
});
