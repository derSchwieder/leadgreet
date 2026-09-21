import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createActivity } from "./activities";
import { createCompany } from "./companies";
import { createContact } from "./contacts";
import { createContentItem } from "./content";
import { getCompanyIntelligence } from "./intelligence";
import { createOpportunity } from "./opportunities";
import { createService } from "./services";
import { createSignal } from "./signals";
import { prisma } from "./client";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("company intelligence tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";
  let otherCompanyId = "";
  let signalId = "";
  let serviceAId = "";
  let contentAId = "";
  let contactId = "";
  let activityAId = "";

  beforeAll(async () => {
    const [accountA, accountB, company, otherCompany] = await Promise.all([
      prisma.account.create({
        data: { name: "Intel Account A", slug: `test-intel-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "Intel Account B", slug: `test-intel-b-${suffix}` },
      }),
      createCompany({
        name: `Intel Co ${suffix}`,
        industry: "manufacturing",
        country: "Germany",
        employees: 800,
        companySize: "LARGE",
      }),
      createCompany({
        name: `Other Intel Co ${suffix}`,
        industry: "logistics",
        country: "Germany",
        employees: 120,
        companySize: "MEDIUM",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;
    otherCompanyId = otherCompany.id;

    const [signal, contact] = await Promise.all([
      createSignal({
        companyId,
        type: "AI_PROJECT",
        title: `[DEMO] KI-Projekt ${suffix}`,
      }),
      createContact({
        companyId,
        firstName: "Seed",
        lastName: "CIO",
        role: "CIO",
        isDecisionMaker: true,
      }),
      createContact({
        companyId: otherCompany.id,
        firstName: "Seed",
        lastName: "Foreign",
        role: "CIO",
        isDecisionMaker: true,
      }),
    ]);
    signalId = signal.id;
    contactId = contact.id;

    const [serviceA, , opportunityA, opportunityB] = await Promise.all([
      createService(accountAId, {
        name: "KI-Navigator",
        matchingSignalTypes: ["AI_PROJECT", "AI_STRATEGY", "GENAI"],
        targetIndustries: ["manufacturing"],
        targetCompanySizes: ["LARGE"],
        targetRoles: ["CIO", "CDO"],
        businessCaseTypes: ["COST_REDUCTION", "CAPACITY", "REVENUE_GROWTH"],
        conversationStarter: "Wo steht das Unternehmen beim Thema KI?",
      }),
      createService(accountBId, {
        name: "Cloud Infrastructure",
        matchingSignalTypes: ["CLOUD_MIGRATION"],
        targetIndustries: ["manufacturing"],
        targetCompanySizes: ["LARGE"],
        targetRoles: ["CIO"],
        conversationStarter: "Nur Account B",
      }),
      createOpportunity({
        accountId: accountAId,
        companyId,
        title: `Intel Opp A ${suffix}`,
      }),
      createOpportunity({
        accountId: accountBId,
        companyId,
        title: `Intel Opp B ${suffix}`,
      }),
    ]);
    if (!serviceA || !opportunityA || !opportunityB) {
      throw new Error("intelligence test setup incomplete");
    }
    serviceAId = serviceA.id;
    const opportunityAId = opportunityA.id;
    const opportunityBId = opportunityB.id;

    const [contentA, , activityA] = await Promise.all([
      createContentItem(accountAId, {
        name: "KI-Navigator – One-Pager",
        type: "ONE_PAGER",
        serviceIds: [serviceAId],
        businessCaseTypes: ["COST_REDUCTION", "CAPACITY"],
        targetRoles: ["CIO"],
      }),
      createContentItem(accountBId, {
        name: "Account-B-Only Deck",
        type: "PRESENTATION",
        businessCaseTypes: ["COST_REDUCTION"],
      }),
      createActivity(accountAId, {
        opportunityId: opportunityAId,
        companyId,
        type: "NOTE",
        subject: "Vorbereitung Account A",
        occurredAt: new Date("2026-09-11T09:00:00.000Z"),
      }),
      createActivity(accountBId, {
        opportunityId: opportunityBId,
        companyId,
        type: "CALL",
        subject: "Nur Account B",
        occurredAt: new Date("2026-09-12T09:00:00.000Z"),
      }),
    ]);
    if (!contentA || !activityA) {
      throw new Error("intelligence test setup incomplete");
    }
    contentAId = contentA.id;
    activityAId = activityA.id;
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.activity.updateMany({
      where: { accountId: { in: accountIds } },
      data: { responseToActivityId: null },
    });
    await prisma.activity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.opportunityStatusHistory.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.contentItem.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.service.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    const companyIds = [companyId, otherCompanyId].filter(Boolean);
    if (companyIds.length > 0) {
      await prisma.signal.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.contact.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
  }, 30000);

  it("matches signal, service, contact, content and activities for account A", async () => {
    const result = await getCompanyIntelligence(companyId, accountAId);
    expect(result.triggerSignal?.id).toBe(signalId);
    expect(result.primaryService?.service.id).toBe(serviceAId);
    expect(result.matchingContact?.id).toBe(contactId);
    expect(result.recommendedContent?.item.id).toBe(contentAId);
    expect(result.recentActivities.map((row) => row.id)).toContain(activityAId);
    expect(result.nextStep).toBeTruthy();
  });

  it("does not recommend account B services or content on the same public signal", async () => {
    const forA = await getCompanyIntelligence(companyId, accountAId);
    const forB = await getCompanyIntelligence(companyId, accountBId);

    expect(forA.triggerSignal?.id).toBe(signalId);
    expect(forB.triggerSignal?.id).toBe(signalId);

    expect(forA.primaryService?.service.name).toBe("KI-Navigator");
    expect(forB.primaryService).toBeNull();

    expect(forA.recommendedContent?.item.name).toBe("KI-Navigator – One-Pager");
    expect(forA.recommendedContent?.item.name).not.toBe("Account-B-Only Deck");
    expect(forB.recommendedContent?.item.name).not.toBe("KI-Navigator – One-Pager");

    expect(forA.recentActivities.some((row) => row.subject === "Vorbereitung Account A")).toBe(true);
    expect(forA.recentActivities.some((row) => row.subject === "Nur Account B")).toBe(false);
    expect(forB.recentActivities.some((row) => row.subject === "Nur Account B")).toBe(true);
    expect(forB.recentActivities.some((row) => row.id === activityAId)).toBe(false);
  });

  it("does not mix another company's contacts into this company", async () => {
    const result = await getCompanyIntelligence(companyId, accountAId);
    expect(result.matchingContact?.fullName).toBe("Seed CIO");
    expect(result.matchingContact?.fullName).not.toBe("Seed Foreign");
  });
});
