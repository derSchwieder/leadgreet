import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EMPTY_ACCOUNT_ICP } from "@/lib/icp/account";
import { prisma } from "./client";
import {
  createRadarProfile,
  deleteRadarProfile,
  getRadarProfile,
  isMissingRadarProfileTable,
  listRadarProfiles,
  updateRadarProfile,
} from "./radar-profiles";
import { getAccountIcp, saveAccountIcp } from "./account-icp";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("RadarProfile tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let tableReady = true;
  let accountAId = "";
  let accountBId = "";

  beforeAll(async () => {
    const [accountA, accountB] = await Promise.all([
      prisma.account.create({
        data: { name: `Radar Profile A ${suffix}`, slug: `test-radar-profile-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: `Radar Profile B ${suffix}`, slug: `test-radar-profile-b-${suffix}` },
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;

    try {
      await createRadarProfile(accountAId, {
        name: "Mein Radar",
        industries: [],
        countries: [],
        minEmployees: null,
        minRevenue: null,
        greetThreshold: 0,
        isActive: true,
      });
    } catch (error) {
      tableReady = !isMissingRadarProfileTable(error);
      if (tableReady) throw error;
    }
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
  });

  it("creates, reads, updates and deletes a radar for the session account", async () => {
    if (!tableReady) return;
    const created = await createRadarProfile(accountAId, {
      name: "Banken",
      industries: ["Banken"],
      countries: ["Deutschland"],
      minEmployees: 50,
      minRevenue: 10_000_000,
      greetThreshold: 75,
      isActive: true,
    });
    expect(created.name).toBe("Banken");
    expect(created.industries).toEqual(["Banken"]);
    expect(created.greetThreshold).toBe(75);

    await expect(getRadarProfile(accountAId, created.id)).resolves.toMatchObject({
      id: created.id,
      name: "Banken",
    });

    const updated = await updateRadarProfile(accountAId, created.id, {
      name: "Versicherungen",
      greetThreshold: 50,
      industries: [],
    });
    expect(updated.name).toBe("Versicherungen");
    expect(updated.greetThreshold).toBe(50);
    expect(updated.industries).toEqual([]);

    await deleteRadarProfile(accountAId, created.id);
    const remaining = await listRadarProfiles(accountAId);
    expect(remaining.some((profile) => profile.id === created.id)).toBe(false);
  });

  it("does not leak account A radars to account B", async () => {
    if (!tableReady) return;
    const forA = await createRadarProfile(accountAId, {
      name: "Automotive",
      industries: ["Automobil"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
      greetThreshold: 0,
      isActive: true,
    });
    const forB = await createRadarProfile(accountBId, {
      name: "Mittelstand",
      industries: ["Industrie"],
      countries: [],
      minEmployees: null,
      minRevenue: null,
      greetThreshold: 0,
      isActive: true,
    });

    const listA = await listRadarProfiles(accountAId);
    const listB = await listRadarProfiles(accountBId);
    expect(listA.some((profile) => profile.id === forA.id)).toBe(true);
    expect(listA.some((profile) => profile.id === forB.id)).toBe(false);
    expect(listB.some((profile) => profile.id === forB.id)).toBe(true);
    expect(listB.some((profile) => profile.id === forA.id)).toBe(false);

    await expect(getRadarProfile(accountBId, forA.id)).rejects.toThrow(/RadarProfile/);
  });

  it("migrates Account.icp onto the default radar without dropping the JSON", async () => {
    if (!tableReady) return;
    const icp = {
      industries: ["Automobil"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    };
    await saveAccountIcp(accountAId, icp);
    const stored = await prisma.account.findUniqueOrThrow({
      where: { id: accountAId },
      select: { icp: true },
    });
    expect(stored.icp).toMatchObject(icp);
    await expect(getAccountIcp(accountAId)).resolves.toEqual(icp);

    const profiles = await listRadarProfiles(accountAId);
    expect(profiles[0]).toMatchObject({
      industries: ["Automobil"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
      greetThreshold: 0,
      isActive: true,
    });
    expect(EMPTY_ACCOUNT_ICP.industries).toEqual([]);
  });
});
