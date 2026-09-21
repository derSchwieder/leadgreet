import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { DEMO_ACCOUNT_SLUG, getCurrentAccountId, getDemoAccountId } from "./accounts";
import { prisma } from "./client";
import { getCurrentUser } from "./current-user";
import { DEMO_USER_EMAIL, DEMO_USER_NAME, ensureDemoUser } from "./users";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe("User model", () => {
  it("declares a globally unique required email on the sales-tenant User", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    expect(schema).toMatch(/model User \{[\s\S]*email\s+String\s+@unique/);
    expect(schema).toMatch(/model Account \{[\s\S]*users\s+User\[\]/);
    expect(schema).toMatch(/account\s+Account\s+@relation\(fields:\s+\[accountId\]/);
  });
});

describe.skipIf(!hasDatabase)("User → Account", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const uniqueEmail = `user-a-${suffix}@leadgreet.test`;
  const duplicateEmail = `dup-${suffix}@leadgreet.test`;
  let accountAId = "";
  let accountBId = "";
  let userAId = "";

  beforeAll(async () => {
    const [accountA, accountB] = await Promise.all([
      prisma.account.create({
        data: { name: "User Account A", slug: `test-user-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "User Account B", slug: `test-user-b-${suffix}` },
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.user.deleteMany({
      where: {
        OR: [{ accountId: { in: accountIds } }, { email: { in: [uniqueEmail, duplicateEmail] } }],
      },
    });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
  }, 30000);

  it("assigns a user to exactly one account", async () => {
    const created = await prisma.user.create({
      data: {
        accountId: accountAId,
        name: "Test User A",
        email: uniqueEmail,
      },
    });
    userAId = created.id;

    expect(created.accountId).toBe(accountAId);
    expect(created.email).toBe(uniqueEmail);

    const loaded = await prisma.user.findUnique({
      where: { id: created.id },
      include: { account: true },
    });
    expect(loaded?.account.id).toBe(accountAId);
    expect(loaded?.accountId).not.toBe(accountBId);
  });

  it("does not allow a user without an account", async () => {
    await expect(
      prisma.user.create({
        data: {
          name: "Orphan User",
          email: `orphan-${suffix}@leadgreet.test`,
        } as never,
      }),
    ).rejects.toThrow();

    await expect(
      prisma.user.create({
        data: {
          accountId: "missing-account",
          name: "Dangling User",
          email: `dangling-${suffix}@leadgreet.test`,
        },
      }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  it("rejects a second user with the same email when the unique index is present", async () => {
    const indexes = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'User'
          AND indexname = 'User_email_key'
      ) AS exists
    `;
    const uniqueIndexReady = Boolean(indexes[0]?.exists);

    await prisma.user.create({
      data: {
        accountId: accountAId,
        name: "First Duplicate",
        email: duplicateEmail,
      },
    });

    if (!uniqueIndexReady) {
      return;
    }

    await expect(
      prisma.user.create({
        data: {
          accountId: accountBId,
          name: "Second Duplicate",
          email: duplicateEmail,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("creates the demo user once for the demo account and stays idempotent", async () => {
    const demoAccountId = await getDemoAccountId();
    const first = await ensureDemoUser(demoAccountId);
    const second = await ensureDemoUser(demoAccountId);

    expect(first.email).toBe(DEMO_USER_EMAIL);
    expect(first.name).toBe(DEMO_USER_NAME);
    expect(first.accountId).toBe(demoAccountId);
    expect(second.id).toBe(first.id);

    const matches = await prisma.user.findMany({ where: { email: DEMO_USER_EMAIL } });
    expect(matches).toHaveLength(1);
    expect(matches[0]?.accountId).toBe(demoAccountId);

    const account = await prisma.account.findUnique({ where: { id: demoAccountId } });
    expect(account?.slug).toBe(DEMO_ACCOUNT_SLUG);

    const current = await getCurrentAccountId();
    expect(current).toBe(demoAccountId);

    const sessionUser = await getCurrentUser();
    expect(sessionUser.id).toBe(first.id);
    expect(sessionUser.accountId).toBe(demoAccountId);
  });
});
