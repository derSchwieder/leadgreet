import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./client";
import { createCompany } from "./companies";
import { listRadarPoints } from "./radar";
import {
  getAccountCompanyState,
  isMissingAccountCompanyStateTable,
  setAccountCompanyState,
} from "./account-company-state";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("AccountCompanyState tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let tableReady = true;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";

  beforeAll(async () => {
    const [accountA, accountB, company] = await Promise.all([
      prisma.account.create({
        data: { name: `Company State A ${suffix}`, slug: `test-company-state-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: `Company State B ${suffix}`, slug: `test-company-state-b-${suffix}` },
      }),
      createCompany({
        name: `State Visible ${suffix}`,
        city: "Nürnberg",
        country: "Deutschland",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;

    try {
      await setAccountCompanyState(accountAId, companyId, null);
    } catch (error) {
      tableReady = !isMissingAccountCompanyStateTable(error);
      if (tableReady) throw error;
    }
  }, 30000);

  afterAll(async () => {
    if (companyId) {
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length > 0) {
      await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    }
  });

  it("hides NOT_RELEVANT and DECLINED companies for that account only", async () => {
    if (!tableReady) return;

    await expect(listRadarPoints(accountAId)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ companyId })]),
    );
    await expect(listRadarPoints(accountBId)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ companyId })]),
    );

    await setAccountCompanyState(accountAId, companyId, "NOT_RELEVANT");
    expect((await listRadarPoints(accountAId)).some((point) => point.companyId === companyId)).toBe(
      false,
    );
    expect((await listRadarPoints(accountBId)).some((point) => point.companyId === companyId)).toBe(
      true,
    );

    await setAccountCompanyState(accountAId, companyId, "DECLINED", "aktuell kein Bedarf");
    expect((await getAccountCompanyState(accountAId, companyId)).status).toBe("DECLINED");
    expect((await listRadarPoints(accountAId)).some((point) => point.companyId === companyId)).toBe(
      false,
    );
    expect((await listRadarPoints(accountBId)).some((point) => point.companyId === companyId)).toBe(
      true,
    );

    await setAccountCompanyState(accountAId, companyId, null);
    expect((await getAccountCompanyState(accountAId, companyId)).status).toBeNull();
    expect((await listRadarPoints(accountAId)).some((point) => point.companyId === companyId)).toBe(
      true,
    );
  });
});
