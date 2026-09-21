import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCompany } from "./companies";
import {
  createOpportunity,
  findActiveOpportunityByCompany,
  findOrCreateOpportunityForCompany,
} from "./opportunities";
import { prisma } from "./client";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("find or create opportunity for company", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";
  let emptyCompanyId = "";
  let lostCompanyId = "";
  let dismissedCompanyId = "";
  let scoredCompanyId = "";

  beforeAll(async () => {
    const [accountA, accountB, company, emptyCompany, lostCompany, dismissedCompany, scoredCompany] =
      await Promise.all([
        prisma.account.create({
          data: { name: "Find Opp A", slug: `test-find-a-${suffix}` },
        }),
        prisma.account.create({
          data: { name: "Find Opp B", slug: `test-find-b-${suffix}` },
        }),
        createCompany({ name: `Find Co ${suffix}`, country: "Germany" }),
        createCompany({ name: `Empty Co ${suffix}`, country: "Germany" }),
        createCompany({ name: `Lost Co ${suffix}`, country: "Germany" }),
        createCompany({ name: `Dismissed Co ${suffix}`, country: "Germany" }),
        createCompany({ name: `Scored Co ${suffix}`, country: "Germany" }),
      ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;
    emptyCompanyId = emptyCompany.id;
    lostCompanyId = lostCompany.id;
    dismissedCompanyId = dismissedCompany.id;
    scoredCompanyId = scoredCompany.id;

    const [activeA, , lost, dismissed, low, high] = await Promise.all([
      createOpportunity({
        accountId: accountAId,
        companyId,
        title: `Active A ${suffix}`,
      }),
      createOpportunity({
        accountId: accountBId,
        companyId,
        title: `Foreign B ${suffix}`,
      }),
      createOpportunity({
        accountId: accountAId,
        companyId: lostCompanyId,
        title: `Lost A ${suffix}`,
        status: "LOST",
      }),
      createOpportunity({
        accountId: accountAId,
        companyId: dismissedCompanyId,
        title: `Dismissed A ${suffix}`,
        status: "DISMISSED",
      }),
      createOpportunity({
        accountId: accountAId,
        companyId: scoredCompanyId,
        title: `Low score ${suffix}`,
      }),
      createOpportunity({
        accountId: accountAId,
        companyId: scoredCompanyId,
        title: `High score ${suffix}`,
      }),
    ]);

    await Promise.all([
      prisma.opportunity.update({
        where: { id: activeA.id },
        data: { opportunityScore: 74 },
      }),
      prisma.opportunity.update({
        where: { id: lost.id },
        data: { opportunityScore: 91, status: "LOST" },
      }),
      prisma.opportunity.update({
        where: { id: dismissed.id },
        data: { opportunityScore: 93, status: "DISMISSED" },
      }),
      prisma.opportunity.update({
        where: { id: low.id },
        data: { opportunityScore: 61 },
      }),
      prisma.opportunity.update({
        where: { id: high.id },
        data: { opportunityScore: 84 },
      }),
    ]);
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.scoreBreakdown.deleteMany({
      where: { opportunity: { accountId: { in: accountIds } } },
    });
    await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    const companyIds = [
      companyId,
      emptyCompanyId,
      lostCompanyId,
      dismissedCompanyId,
      scoredCompanyId,
    ].filter(Boolean);
    if (companyIds.length > 0) {
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
  }, 30000);

  it("finds the account's own active opportunity", async () => {
    const found = await findActiveOpportunityByCompany(accountAId, companyId);
    expect(found).not.toBeNull();
    const owned = await prisma.opportunity.findFirstOrThrow({
      where: { id: found!.id },
    });
    expect(owned.accountId).toBe(accountAId);
    expect(owned.companyId).toBe(companyId);
    expect(owned.status).not.toBe("LOST");
    expect(owned.status).not.toBe("DISMISSED");
  });

  it("ignores LOST opportunities", async () => {
    const found = await findActiveOpportunityByCompany(accountAId, lostCompanyId);
    expect(found).toBeNull();
  });

  it("ignores DISMISSED opportunities", async () => {
    const found = await findActiveOpportunityByCompany(accountAId, dismissedCompanyId);
    expect(found).toBeNull();
  });

  it("selects the highest opportunityScore when several are active", async () => {
    const found = await findActiveOpportunityByCompany(accountAId, scoredCompanyId);
    expect(found).not.toBeNull();
    const row = await prisma.opportunity.findFirstOrThrow({ where: { id: found!.id } });
    expect(row.opportunityScore).toBe(84);
    expect(row.title).toBe(`High score ${suffix}`);
  });

  it("creates a missing opportunity once", async () => {
    const first = await findOrCreateOpportunityForCompany(accountAId, emptyCompanyId);
    expect(first.created).toBe(true);
    const second = await findOrCreateOpportunityForCompany(accountAId, emptyCompanyId);
    expect(second.created).toBe(false);
    expect(second.opportunityId).toBe(first.opportunityId);
    const count = await prisma.opportunity.count({
      where: { accountId: accountAId, companyId: emptyCompanyId },
    });
    expect(count).toBe(1);
  });

  it("does not use another account's opportunity", async () => {
    const foundByA = await findActiveOpportunityByCompany(accountAId, companyId);
    const foundByB = await findActiveOpportunityByCompany(accountBId, companyId);
    expect(foundByA).not.toBeNull();
    expect(foundByB).not.toBeNull();
    expect(foundByA?.id).not.toBe(foundByB?.id);

    const resolvedForB = await findOrCreateOpportunityForCompany(accountBId, companyId);
    expect(resolvedForB.created).toBe(false);
    expect(resolvedForB.opportunityId).toBe(foundByB?.id);
    expect(resolvedForB.opportunityId).not.toBe(foundByA?.id);
  });
});
