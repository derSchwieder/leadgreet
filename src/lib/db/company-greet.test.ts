import { afterAll, describe, expect, it } from "vitest";
import { createCompany } from "./companies";
import { getCompanyGreet } from "./company-greet";
import { createOpportunity, getOpportunityById } from "./opportunities";
import { createSignal } from "./signals";
import { prisma } from "./client";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("company greet", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const companyIds: string[] = [];
  const accountIds: string[] = [];
  const now = new Date("2026-09-22T12:00:00.000Z");

  afterAll(async () => {
    if (accountIds.length > 0) {
      await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
      await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    }
    if (companyIds.length > 0) {
      await prisma.signal.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
  });

  it("A: computes Company-Greet without an opportunity", async () => {
    const company = await createCompany({
      name: `Greet Solo ${suffix}`,
      city: "Nürnberg",
      country: "Deutschland",
    });
    companyIds.push(company.id);
    await createSignal({
      companyId: company.id,
      type: "AI_AGENT",
      title: `Current agent ${suffix}`,
      detectedAt: new Date("2026-09-08T12:00:00.000Z"),
      eventDate: new Date("2026-09-08T12:00:00.000Z"),
    });

    const opportunities = await prisma.opportunity.count({ where: { companyId: company.id } });
    const greet = await getCompanyGreet(company.id, now);

    expect(opportunities).toBe(0);
    expect(greet.opportunityScore).toBeGreaterThan(0);
    expect(greet.freshness).toBeGreaterThan(10);
  });

  it("B: HARTING-like company gets a Company-Greet without an opportunity", async () => {
    const company = await createCompany({
      name: `HARTING Greet ${suffix}`,
      city: "Espelkamp",
      country: "Deutschland",
      website: "https://www.harting.com",
    });
    companyIds.push(company.id);
    await prisma.company.update({
      where: { id: company.id },
      data: { latitude: 52.3775, longitude: 8.6231 },
    });
    await createSignal({
      companyId: company.id,
      type: "ERP_TRANSFORMATION",
      title: `RISE with SAP ${suffix}`,
      detectedAt: new Date("2026-09-02T12:00:00.000Z"),
      eventDate: new Date("2026-09-02T12:00:00.000Z"),
    });

    const greet = await getCompanyGreet(company.id, now);
    const opportunityCount = await prisma.opportunity.count({ where: { companyId: company.id } });

    expect(opportunityCount).toBe(0);
    expect(greet.opportunityScore).toBeGreaterThan(0);
    expect(greet.freshness).toBe(90);
  });

  it("C/D: TeamViewer Company-Greet uses 2026 signals while Opportunity-Greet stays 57", async () => {
    const company = await createCompany({
      name: `TeamViewer Greet ${suffix}`,
      city: "Göppingen",
      country: "Deutschland",
      website: "https://www.teamviewer.com",
      industry: "Software",
    });
    companyIds.push(company.id);

    const oldGenai = await createSignal({
      companyId: company.id,
      type: "GENAI",
      title: `TeamViewer Intelligence ${suffix}`,
      detectedAt: new Date("2025-07-02T12:00:00.000Z"),
      eventDate: new Date("2025-07-02T12:00:00.000Z"),
    });
    const oldModernization = await createSignal({
      companyId: company.id,
      type: "SOFTWARE_MODERNIZATION",
      title: `Agentless Access ${suffix}`,
      detectedAt: new Date("2025-11-10T12:00:00.000Z"),
      eventDate: new Date("2025-11-10T12:00:00.000Z"),
    });

    const account = await prisma.account.create({
      data: { name: `Greet Account ${suffix}`, slug: `test-greet-${suffix}` },
    });
    accountIds.push(account.id);

    const opportunity = await createOpportunity({
      accountId: account.id,
      companyId: company.id,
      signalIds: [oldGenai.id, oldModernization.id],
    });
    await prisma.opportunity.update({
      where: { id: opportunity.id },
      data: { opportunityScore: 57, freshness: 10 },
    });

    await createSignal({
      companyId: company.id,
      type: "AI_AGENT",
      title: `Tia Troubleshooting ${suffix}`,
      detectedAt: new Date("2026-09-08T12:00:00.000Z"),
      eventDate: new Date("2026-09-08T12:00:00.000Z"),
    });
    await createSignal({
      companyId: company.id,
      type: "AI_STRATEGY",
      title: `AI adoption ninefold ${suffix}`,
      detectedAt: new Date("2026-09-15T12:00:00.000Z"),
      eventDate: new Date("2026-09-15T12:00:00.000Z"),
    });

    const stored = await getOpportunityById(opportunity.id, account.id);
    const companyGreet = await getCompanyGreet(company.id, now);

    expect(stored.opportunityScore).toBe(57);
    expect(stored.freshness).toBe(10);
    expect(companyGreet.freshness).toBe(100);
    expect(companyGreet.opportunityScore).not.toBe(57);
  });
});
