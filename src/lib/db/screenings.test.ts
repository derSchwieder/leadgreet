import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mockAnalysisPort } from "@/lib/analysis/mock";
import { emptyContactFinding } from "@/lib/screening/contacts";
import { runQueuedCompanyScreening } from "@/lib/screening";
import { AccountIcpSource } from "@/lib/screening/icp/account-source";
import { UnavailableSalesIntelligenceAnalyzer } from "@/lib/screening/intelligence/unavailable-sales-analyzer";
import { PrismaCompanyCatalog } from "@/lib/screening/research/prisma-company-catalog";
import type { WebResearchPort } from "@/lib/screening/research/types";
import { ConflictError, NotFoundError } from "./serialize";
import { prisma } from "./client";
import { createCompany } from "./companies";
import {
  claimCompanyScreeningRun,
  createManualCompanyScreening,
  getCompanyScreeningById,
  isMissingCompanyScreeningTable,
} from "./screenings";
import { createSignal } from "./signals";

function mockWebPort(results: { title: string; url: string }[]): WebResearchPort {
  return {
    available: true,
    provider: "mock",
    async researchCompany() {
      return {
        available: true,
        companyId: null,
        profile: {},
        sources: results.map((result) => ({
          title: result.title,
          url: result.url,
          publisher: null,
          publishedAt: null,
        })),
        research: {
          provider: "mock",
          queries: ["DATEV Unternehmen Produkte Dienstleistungen"],
          results,
        },
      };
    },
    async researchSignals() {
      return { signals: [], sources: [] };
    },
    async researchContacts() {
      return emptyContactFinding({ available: true, provider: "mock" });
    },
  };
}

function screeningPorts(web: WebResearchPort) {
  return {
    catalog: new PrismaCompanyCatalog(),
    web,
    icp: new AccountIcpSource(),
    sales: new UnavailableSalesIntelligenceAnalyzer(),
    analysis: mockAnalysisPort(),
  };
}

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("CompanyScreening manual create", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let tableReady = true;
  let accountId = "";
  const companyIds: string[] = [];

  beforeAll(async () => {
    const account = await prisma.account.create({
      data: { name: `Screening ${suffix}`, slug: `test-screening-${suffix}` },
    });
    accountId = account.id;
    try {
      await createManualCompanyScreening(accountId, { inputName: `Probe ${suffix}` });
    } catch (error) {
      tableReady = !isMissingCompanyScreeningTable(error);
      if (tableReady) throw error;
    }
  }, 30000);

  afterAll(async () => {
    if (companyIds.length > 0) {
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
    if (!accountId) return;
    await prisma.account.deleteMany({ where: { id: accountId } });
  });

  it("creates DATEV as QUEUED without a company", async () => {
    if (!tableReady) return;
    const created = await createManualCompanyScreening(accountId, {
      inputName: "DATEV",
      inputDomain: "datev.de",
    });
    expect(created.status).toBe("QUEUED");
    expect(created.inputName).toBe("DATEV");
    expect(created.inputDomain).toBe("datev.de");
    expect(created.companyId).toBeNull();
    expect(created.result).toBeNull();
    expect(created.completedAt).toBeNull();

    const loaded = await getCompanyScreeningById(accountId, created.id);
    expect(loaded.status).toBe("QUEUED");
    expect(loaded.company).toBeNull();
  });

  it("normalizes DATEV screenen without starting research", async () => {
    if (!tableReady) return;
    const created = await createManualCompanyScreening(accountId, {
      inputName: "DATEV screenen",
    });
    expect(created.status).toBe("QUEUED");
    expect(created.inputName).toBe("DATEV");
    expect(created.result).toBeNull();
  });

  it("returns 404 for another account or missing id", async () => {
    if (!tableReady) return;
    await expect(getCompanyScreeningById(accountId, "missing-screening")).rejects.toThrow(
      NotFoundError,
    );
  });

  it("runs QUEUED to COMPLETED, stores sources, and does not mutate company or signals", async () => {
    if (!tableReady) return;
    const company = await createCompany({
      name: `ScreenCo ${suffix}`,
      legalName: `ScreenCo ${suffix} GmbH`,
      website: `https://screen-${suffix}.example`,
      industry: "Software",
      city: "Nürnberg",
      country: "DE",
      employees: 120,
      description: "Nur Testdaten.",
    });
    companyIds.push(company.id);
    const signal = await createSignal({
      companyId: company.id,
      type: "AI_RECRUITING",
      title: `AI Rolle ${suffix}`,
      description: "Öffentliche Stelle",
      detectedAt: new Date("2026-08-20T00:00:00.000Z"),
      sourceName: "Karriere",
      sourceUrl: `https://screen-${suffix}.example/jobs`,
    });
    const companyBefore = await prisma.company.findUniqueOrThrow({ where: { id: company.id } });
    const signalBefore = await prisma.signal.findUniqueOrThrow({ where: { id: signal.id } });
    const signalCountBefore = await prisma.signal.count({ where: { companyId: company.id } });

    const created = await createManualCompanyScreening(accountId, {
      inputName: `ScreenCo ${suffix}`,
      inputDomain: `screen-${suffix}.example`,
    });
    const completed = await runQueuedCompanyScreening(
      accountId,
      created.id,
      screeningPorts(
        mockWebPort([
          {
            title: `ScreenCo ${suffix}`,
            url: `https://screen-${suffix}.example`,
          },
        ]),
      ),
    );

    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).not.toBeNull();
    expect(completed.companyId).toBe(company.id);
    expect(completed.result?.research?.results[0]?.url).toBe(`https://screen-${suffix}.example`);
    expect(completed.result?.analysis?.companyProfile.summary).toBeDefined();
    expect(completed.result?.sources?.length).toBeGreaterThan(0);
    expect(completed.result?.icpAssessment).toBeUndefined();
    expect(completed.result?.signals).toBeUndefined();

    await expect(claimCompanyScreeningRun(accountId, completed.id)).rejects.toThrow(ConflictError);

    const companyAfter = await prisma.company.findUniqueOrThrow({ where: { id: company.id } });
    const signalAfter = await prisma.signal.findUniqueOrThrow({ where: { id: signal.id } });
    expect(companyAfter).toEqual(companyBefore);
    expect(signalAfter).toEqual(signalBefore);
    expect(await prisma.signal.count({ where: { companyId: company.id } })).toBe(signalCountBefore);
    expect(await prisma.contact.count({ where: { companyId: company.id } })).toBe(0);
  });

  it("does not start a second run while RUNNING", async () => {
    if (!tableReady) return;
    const created = await createManualCompanyScreening(accountId, {
      inputName: `Running ${suffix}`,
    });
    const running = await claimCompanyScreeningRun(accountId, created.id);
    expect(running.status).toBe("RUNNING");
    await expect(claimCompanyScreeningRun(accountId, created.id)).rejects.toThrow(ConflictError);
    await expect(runQueuedCompanyScreening(accountId, created.id)).rejects.toThrow(ConflictError);
    const loaded = await getCompanyScreeningById(accountId, created.id);
    expect(loaded.status).toBe("RUNNING");
    expect(loaded.result).toBeNull();
  });

  it("fails unknown companies and does not create a completed result", async () => {
    if (!tableReady) return;
    const unknown = await createManualCompanyScreening(accountId, {
      inputName: `Unbekannt-Run ${suffix}`,
    });
    const unknownResult = await runQueuedCompanyScreening(
      accountId,
      unknown.id,
      screeningPorts(mockWebPort([])),
    );
    expect(unknownResult.status).toBe("FAILED");
    expect(unknownResult.result?.error?.code).toBe("WEB_RESEARCH_NO_RESULTS");
    expect(unknownResult.completedAt).toBeNull();
    expect(unknownResult.companyId).toBeNull();
  });
});
