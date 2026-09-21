import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as accounts from "./accounts";
import { createCompany } from "./companies";
import { getDashboardData } from "./dashboard";
import {
  createOpportunity,
  getOpportunityById,
  listOpportunities,
  updateOpportunityStatus,
} from "./opportunities";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("opportunity tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";
  let opportunityAId = "";
  let opportunityBId = "";

  beforeAll(async () => {
    const [accountA, accountB, company] = await Promise.all([
      prisma.account.create({
        data: { name: "Opp Account A", slug: `test-opp-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "Opp Account B", slug: `test-opp-b-${suffix}` },
      }),
      createCompany({
        name: `Test Opp Co ${suffix}`,
        industry: "manufacturing",
        country: "Germany",
        city: "Nürnberg",
        employees: 400,
        companySize: "MEDIUM",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;

    const [opportunityA, opportunityB] = await Promise.all([
      createOpportunity({
        accountId: accountAId,
        companyId,
        title: `Opp A ${suffix}`,
      }),
      createOpportunity({
        accountId: accountBId,
        companyId,
        title: `Opp B ${suffix}`,
      }),
    ]);
    opportunityAId = opportunityA.id;
    opportunityBId = opportunityB.id;

    await Promise.all([
      prisma.opportunity.update({
        where: { id: opportunityAId },
        data: { opportunityScore: 81 },
      }),
      prisma.opportunity.update({
        where: { id: opportunityBId },
        data: { opportunityScore: 88 },
      }),
    ]);
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.opportunityStatusHistory.deleteMany({
      where: { accountId: { in: accountIds } },
    });
    await prisma.scoreBreakdown.deleteMany({
      where: { opportunity: { accountId: { in: accountIds } } },
    });
    await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    if (companyId) {
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
  }, 30000);

  it("lets account A see its own opportunity", async () => {
    const listed = await listOpportunities(accountAId);
    expect(listed.map((row) => row.id)).toEqual([opportunityAId]);
    expect(listed[0]?.title).toBe(`Opp A ${suffix}`);
    expect(listed[0]?.accountId).toBe(accountAId);

    const loaded = await getOpportunityById(opportunityAId, accountAId);
    expect(loaded.id).toBe(opportunityAId);
    expect(loaded.company.id).toBe(companyId);
  });

  it("does not list account B opportunities for account A", async () => {
    const forA = await listOpportunities(accountAId);
    const forB = await listOpportunities(accountBId);
    expect(forA.some((row) => row.id === opportunityBId)).toBe(false);
    expect(forB.map((row) => row.id)).toEqual([opportunityBId]);
  });

  it("cannot read a foreign opportunity by id", async () => {
    await expect(getOpportunityById(opportunityBId, accountAId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(getOpportunityById(opportunityAId, accountBId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("still supports legitimate status updates for the owning account", async () => {
    const updated = await updateOpportunityStatus(accountAId, opportunityAId, "QUALIFIED");
    expect(updated.status).toBe("QUALIFIED");
    expect(updated.id).toBe(opportunityAId);

    await expect(
      updateOpportunityStatus(accountBId, opportunityAId, "CONTACTED"),
    ).rejects.toBeInstanceOf(NotFoundError);

    const stillA = await getOpportunityById(opportunityAId, accountAId);
    expect(stillA.status).toBe("QUALIFIED");
  });

  it("requires an explicit accountId and does not fall back to the demo account", async () => {
    const spy = vi.spyOn(accounts, "getDemoAccountId");

    await expect(
      createOpportunity({
        accountId: "   ",
        companyId,
        title: `Opp missing account ${suffix}`,
      }),
    ).rejects.toThrow(/accountId is required/);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();

    const leftover = await prisma.opportunity.findMany({
      where: { title: `Opp missing account ${suffix}` },
    });
    expect(leftover).toEqual([]);
  });

  it("keeps dashboard hot opportunities inside the current account", async () => {
    const dashA = await getDashboardData(accountAId);
    const dashB = await getDashboardData(accountBId);

    expect(dashA.hotOpportunities.map((row) => row.id)).toEqual([opportunityAId]);
    expect(dashB.hotOpportunities.map((row) => row.id)).toEqual([opportunityBId]);
    expect(dashA.kpis.hotOpportunities).toBe(1);
    expect(dashB.kpis.hotOpportunities).toBe(1);
  });
});
