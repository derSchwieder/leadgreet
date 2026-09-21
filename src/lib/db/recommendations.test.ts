import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCompany } from "./companies";
import { createOpportunity } from "./opportunities";
import { getRecommendations } from "./recommendations";
import { createService } from "./services";
import { createSignal } from "./signals";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("recommendation tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";
  let opportunityAId = "";
  let opportunityBId = "";
  let serviceAId = "";
  let serviceBId = "";

  beforeAll(async () => {
    const [accountA, accountB, company] = await Promise.all([
      prisma.account.create({
        data: { name: "Rec Account A", slug: `test-rec-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "Rec Account B", slug: `test-rec-b-${suffix}` },
      }),
      createCompany({
        name: `Test Rec Co ${suffix}`,
        industry: "manufacturing",
        country: "Germany",
        employees: 800,
        companySize: "LARGE",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;

    await Promise.all([
      createSignal({
        companyId,
        type: "AI_PROJECT",
        title: `KI-Projekt ${suffix}`,
      }),
      createSignal({
        companyId,
        type: "CLOUD_MIGRATION",
        title: `Cloud-Migration ${suffix}`,
      }),
    ]);

    const [opportunityA, opportunityB, serviceA, serviceB] = await Promise.all([
      createOpportunity({
        accountId: accountAId,
        companyId,
        title: `Rec Opp A ${suffix}`,
      }),
      createOpportunity({
        accountId: accountBId,
        companyId,
        title: `Rec Opp B ${suffix}`,
      }),
      createService(accountAId, {
        name: "KI-Navigator",
        matchingSignalTypes: ["AI_PROJECT", "AI_STRATEGY", "GENAI"],
        targetIndustries: ["manufacturing"],
        targetCompanySizes: ["LARGE"],
        targetRoles: ["CIO", "CDO"],
        conversationStarter: "Wo steht das Unternehmen aktuell beim Thema KI?",
      }),
      createService(accountBId, {
        name: "Cloud Infrastructure",
        matchingSignalTypes: ["CLOUD_MIGRATION"],
        targetIndustries: ["manufacturing"],
        targetCompanySizes: ["LARGE"],
        targetRoles: ["CIO"],
        conversationStarter: "Account B only",
      }),
    ]);
    opportunityAId = opportunityA.id;
    opportunityBId = opportunityB.id;
    serviceAId = serviceA.id;
    serviceBId = serviceB.id;
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.scoreBreakdown.deleteMany({
      where: { opportunity: { accountId: { in: accountIds } } },
    });
    await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.service.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    if (companyId) {
      await prisma.signal.deleteMany({ where: { companyId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
  }, 30000);

  it("does not recommend account B services for an account A opportunity", async () => {
    const result = await getRecommendations(accountAId, opportunityAId);
    expect(result.recommendations.some((row) => row.service.id === serviceBId)).toBe(false);
    expect(result.recommendations.some((row) => row.service.name === "Cloud Infrastructure")).toBe(
      false,
    );
    expect(result.recommendations.every((row) => row.service.accountId === accountAId)).toBe(true);
    expect(result.recommendations.some((row) => row.service.id === serviceAId)).toBe(true);
  });

  it("does not let account B read recommendations for account A's opportunity", async () => {
    await expect(getRecommendations(accountBId, opportunityAId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("only uses account B services for account B", async () => {
    const result = await getRecommendations(accountBId, opportunityBId);
    expect(result.recommendations.some((row) => row.service.id === serviceAId)).toBe(false);
    expect(result.recommendations.every((row) => row.service.accountId === accountBId)).toBe(true);
  });
});
