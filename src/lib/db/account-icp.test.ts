import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./client";
import { getAccountIcp, isMissingAccountIcpColumn, saveAccountIcp } from "./account-icp";
import { EMPTY_ACCOUNT_ICP } from "@/lib/icp/account";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("account ICP tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let columnReady = true;
  let accountAId = "";
  let accountBId = "";
  let userA1Id = "";
  let userA2Id = "";

  beforeAll(async () => {
    const [accountA, accountB] = await Promise.all([
      prisma.account.create({
        data: { name: `ICP Account A ${suffix}`, slug: `test-icp-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: `ICP Account B ${suffix}`, slug: `test-icp-b-${suffix}` },
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;

    try {
      await saveAccountIcp(accountAId, EMPTY_ACCOUNT_ICP);
    } catch (error) {
      columnReady = !isMissingAccountIcpColumn(error);
      if (columnReady) throw error;
      return;
    }

    const [userA1, userA2] = await Promise.all([
      prisma.user.create({
        data: {
          accountId: accountAId,
          name: "ICP User A1",
          email: `icp-a1-${suffix}@leadgreet.test`,
        },
      }),
      prisma.user.create({
        data: {
          accountId: accountAId,
          name: "ICP User A2",
          email: `icp-a2-${suffix}@leadgreet.test`,
        },
      }),
    ]);
    userA1Id = userA1.id;
    userA2Id = userA2.id;
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.user.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
  });

  it("loads an empty ICP before anything is saved", async () => {
    if (!columnReady) return;
    await expect(getAccountIcp(accountAId)).resolves.toEqual(EMPTY_ACCOUNT_ICP);
    await expect(getAccountIcp(accountBId)).resolves.toEqual(EMPTY_ACCOUNT_ICP);
    expect(userA1Id).toBeTruthy();
    expect(userA2Id).toBeTruthy();
  });

  it("saves and reloads the same ICP for the account", async () => {
    if (!columnReady) return;
    const saved = await saveAccountIcp(accountAId, {
      industries: ["Industrie"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    });
    expect(saved).toEqual({
      industries: ["Industrie"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    });
    await expect(getAccountIcp(accountAId)).resolves.toEqual(saved);
  });

  it("keeps the ICP on the account for another user of the same tenant", async () => {
    if (!columnReady) return;
    await expect(getAccountIcp(accountAId)).resolves.toEqual({
      industries: ["Industrie"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    });
  });

  it("does not leak account A ICP to account B", async () => {
    if (!columnReady) return;
    await saveAccountIcp(accountBId, {
      industries: ["Software"],
      countries: ["Schweiz"],
      minEmployees: 20,
      minRevenue: null,
    });
    await expect(getAccountIcp(accountAId)).resolves.toEqual({
      industries: ["Industrie"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    });
    await expect(getAccountIcp(accountBId)).resolves.toEqual({
      industries: ["Software"],
      countries: ["Schweiz"],
      minEmployees: 20,
      minRevenue: null,
    });
  });

  it("stores empty filters as empty arrays and null minima", async () => {
    if (!columnReady) return;
    const saved = await saveAccountIcp(accountAId, EMPTY_ACCOUNT_ICP);
    expect(saved).toEqual(EMPTY_ACCOUNT_ICP);
    await expect(getAccountIcp(accountAId)).resolves.toEqual(EMPTY_ACCOUNT_ICP);
  });
});
