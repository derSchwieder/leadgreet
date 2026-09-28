import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnavailableAnalysisPort, type AnalysisPort } from "@/lib/analysis";
import { AnalysisError, LLM_API_KEY_MISSING, LLM_PROVIDER_ERROR } from "@/lib/analysis/errors";
import { mockAnalysisPort } from "@/lib/analysis/mock";
import { BraveWebResearchAdapter } from "@/lib/research/brave/adapter";
import { TavilyWebResearchAdapter } from "@/lib/research/tavily/adapter";
import { emptyContactFinding } from "./contacts";
import { executeScreeningPipeline, runQueuedCompanyScreening } from "./orchestrator";
import { UnavailableSalesIntelligenceAnalyzer } from "./intelligence/unavailable-sales-analyzer";
import { UnavailableWebResearchPort } from "./research/unavailable-web-researcher";
import {
  BRAVE_API_KEY_MISSING,
  TAVILY_API_KEY_MISSING,
  WEB_RESEARCH_NO_RESULTS,
  WEB_RESEARCH_PROVIDER_ERROR,
  WEB_RESEARCH_UNAVAILABLE,
  WebResearchError,
} from "./research/types";
import type {
  CompanyCatalogPort,
  IcpSourcePort,
  LocalCatalogCompany,
  WebResearchPort,
} from "./research/types";

const {
  claimCompanyScreeningRun,
  completeCompanyScreening,
  failCompanyScreening,
  getCompanyScreeningById,
} = vi.hoisted(() => ({
  claimCompanyScreeningRun: vi.fn(),
  completeCompanyScreening: vi.fn(),
  failCompanyScreening: vi.fn(),
  getCompanyScreeningById: vi.fn(),
}));

vi.mock("@/lib/db/screenings", () => ({
  claimCompanyScreeningRun,
  completeCompanyScreening,
  failCompanyScreening,
  getCompanyScreeningById,
}));

const datev: LocalCatalogCompany = {
  id: "co-datev",
  name: "DATEV",
  legalName: "DATEV eG",
  website: "https://www.datev.de",
  industry: "Software",
  city: "Nürnberg",
  country: "DE",
  employees: 8000,
  revenue: "1200000000",
  ownership: null,
  description: "Software und Services für Steuerberater.",
};

function memoryCatalog(companies: LocalCatalogCompany[]): CompanyCatalogPort {
  return {
    async findByNameOrDomain(input) {
      return (
        companies.find(
          (company) =>
            company.name.toLocaleLowerCase("de") === input.name.toLocaleLowerCase("de") ||
            (input.domain && company.website?.includes(input.domain)),
        ) ?? null
      );
    },
    async listSignals() {
      return [];
    },
  };
}

const icp: IcpSourcePort = {
  async getProfile() {
    return { industries: ["Software"], countries: ["DE"] };
  },
};

function researchPort(results: { title: string; url: string }[]): WebResearchPort {
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
          results: results.map((result) => ({
            title: result.title,
            url: result.url,
          })),
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

function ports(overrides: {
  web: WebResearchPort;
  catalog?: CompanyCatalogPort;
  analysis?: AnalysisPort;
}) {
  return {
    catalog: overrides.catalog ?? memoryCatalog([]),
    web: overrides.web,
    icp,
    sales: new UnavailableSalesIntelligenceAnalyzer(),
    analysis: overrides.analysis ?? mockAnalysisPort(),
  };
}

describe("executeScreeningPipeline", () => {
  it("does not call analysis after a research failure", async () => {
    const analysis = mockAnalysisPort();
    const analyze = vi.spyOn(analysis, "analyze");
    await executeScreeningPipeline(ports({ web: new UnavailableWebResearchPort(), analysis }), {
      accountId: "acc-1",
      name: "DATEV",
    });
    expect(analyze).not.toHaveBeenCalled();
  });

  it("fails when web research is not configured instead of inventing a catalog success", async () => {
    const outcome = await executeScreeningPipeline(
      ports({ web: new UnavailableWebResearchPort(), catalog: memoryCatalog([datev]) }),
      { accountId: "acc-1", name: "DATEV", domain: "datev.de" },
    );
    expect(outcome).toMatchObject({
      status: "FAILED",
      code: WEB_RESEARCH_UNAVAILABLE,
    });
  });

  it("fails with TAVILY_API_KEY_MISSING when the Tavily adapter has no key", async () => {
    const outcome = await executeScreeningPipeline(
      ports({ web: new TavilyWebResearchAdapter({ apiKey: null, gapMs: 0 }) }),
      { accountId: "acc-1", name: "DATEV" },
    );
    expect(outcome).toMatchObject({
      status: "FAILED",
      code: TAVILY_API_KEY_MISSING,
    });
  });

  it("fails with BRAVE_API_KEY_MISSING when the Brave adapter has no key", async () => {
    const outcome = await executeScreeningPipeline(
      ports({ web: new BraveWebResearchAdapter({ apiKey: null, gapMs: 0 }) }),
      { accountId: "acc-1", name: "DATEV" },
    );
    expect(outcome).toMatchObject({
      status: "FAILED",
      code: BRAVE_API_KEY_MISSING,
    });
  });

  it("fails when the mocked web port finds nothing", async () => {
    const outcome = await executeScreeningPipeline(ports({ web: researchPort([]) }), {
      accountId: "acc-1",
      name: "DATEV",
    });
    expect(outcome).toMatchObject({
      status: "FAILED",
      code: WEB_RESEARCH_NO_RESULTS,
    });
  });

  it("fails on a provider error without inventing results", async () => {
    const web: WebResearchPort = {
      available: true,
      provider: "mock",
      async researchCompany() {
        throw new WebResearchError(WEB_RESEARCH_PROVIDER_ERROR, "upstream down");
      },
      async researchSignals() {
        return { signals: [], sources: [] };
      },
      async researchContacts() {
        return emptyContactFinding({ available: true, provider: "mock" });
      },
    };
    const outcome = await executeScreeningPipeline(ports({ web }), {
      accountId: "acc-1",
      name: "DATEV",
    });
    expect(outcome).toMatchObject({
      status: "FAILED",
      code: WEB_RESEARCH_PROVIDER_ERROR,
    });
  });

  it("completes after research and analysis without writing contacts or running matchesIcp", async () => {
    const outcome = await executeScreeningPipeline(
      ports({
        catalog: memoryCatalog([datev]),
        web: researchPort([{ title: "DATEV", url: "https://www.datev.de" }]),
      }),
      { accountId: "acc-1", name: "DATEV", domain: "datev.de" },
    );
    expect(outcome.status).toBe("COMPLETED");
    if (outcome.status !== "COMPLETED") return;
    expect(outcome.companyId).toBe("co-datev");
    expect(outcome.payload.research?.results[0]?.url).toBe("https://www.datev.de");
    expect(outcome.payload.analysis?.companyProfile.summary).toContain("DATEV");
    expect(
      outcome.payload.analysis?.limitations.some((item) => /ICP scoring was not executed/.test(item)),
    ).toBe(true);
    expect(outcome.payload.contacts).toBeUndefined();
  });

  it("fails when the LLM key is missing after successful research", async () => {
    const outcome = await executeScreeningPipeline(
      ports({
        web: researchPort([{ title: "DATEV", url: "https://www.datev.de" }]),
        analysis: new UnavailableAnalysisPort(),
      }),
      { accountId: "acc-1", name: "DATEV" },
    );
    expect(outcome).toMatchObject({
      status: "FAILED",
      code: LLM_API_KEY_MISSING,
    });
  });

  it("fails when LLM analysis throws", async () => {
    const outcome = await executeScreeningPipeline(
      ports({
        web: researchPort([{ title: "DATEV", url: "https://www.datev.de" }]),
        analysis: {
          available: true,
          provider: "mock",
          async analyze() {
            throw new AnalysisError(LLM_PROVIDER_ERROR, "upstream down");
          },
        },
      }),
      { accountId: "acc-1", name: "DATEV" },
    );
    expect(outcome).toMatchObject({
      status: "FAILED",
      code: LLM_PROVIDER_ERROR,
    });
  });

  it("stays COMPLETED when contact research finds no people", async () => {
    const outcome = await executeScreeningPipeline(
      ports({
        catalog: memoryCatalog([datev]),
        web: researchPort([{ title: "DATEV", url: "https://www.datev.de" }]),
      }),
      { accountId: "acc-1", name: "DATEV", domain: "datev.de" },
    );
    expect(outcome.status).toBe("COMPLETED");
    if (outcome.status !== "COMPLETED") return;
    expect(outcome.payload.analysis?.relevantContacts).toEqual([]);
    expect(outcome.payload.contacts).toBeUndefined();
    expect(outcome.payload.limitations?.some((item) => /Ansprechpartner/.test(item))).toBe(true);
  });

  it("stays COMPLETED when contact research throws after company research succeeded", async () => {
    const web = researchPort([{ title: "DATEV", url: "https://www.datev.de" }]);
    web.researchContacts = async () => {
      throw new WebResearchError("CONTACT_RESEARCH_FAILED", "contact search down");
    };
    const outcome = await executeScreeningPipeline(
      ports({ catalog: memoryCatalog([datev]), web }),
      { accountId: "acc-1", name: "DATEV", domain: "datev.de" },
    );
    expect(outcome.status).toBe("COMPLETED");
    if (outcome.status !== "COMPLETED") return;
    expect(outcome.payload.analysis?.relevantContacts).toEqual([]);
    expect(outcome.payload.contactResearch?.candidates).toEqual([]);
    expect(outcome.payload.limitations?.some((item) => /Contact research provider failed/.test(item))).toBe(
      true,
    );
  });
});

describe("runQueuedCompanyScreening", () => {
  beforeEach(() => {
    claimCompanyScreeningRun.mockReset();
    completeCompanyScreening.mockReset();
    failCompanyScreening.mockReset();
    getCompanyScreeningById.mockReset();
    claimCompanyScreeningRun.mockResolvedValue({
      id: "scr-1",
      status: "RUNNING",
      inputName: "DATEV",
      inputDomain: "datev.de",
    });
    getCompanyScreeningById.mockResolvedValue({
      id: "scr-1",
      status: "RUNNING",
      inputName: "DATEV",
      inputDomain: "datev.de",
    });
    completeCompanyScreening.mockImplementation(async (_accountId, id, input) => ({
      id,
      status: "COMPLETED",
      companyId: input.companyId,
      result: input.payload,
    }));
    failCompanyScreening.mockImplementation(async (_accountId, id, error) => ({
      id,
      status: "FAILED",
      result: error ? { error } : null,
    }));
  });

  it("moves QUEUED to COMPLETED after mocked research and analysis", async () => {
    const screening = await runQueuedCompanyScreening(
      "acc-1",
      "scr-1",
      ports({
        catalog: memoryCatalog([datev]),
        web: researchPort([{ title: "DATEV", url: "https://www.datev.de" }]),
      }),
    );
    expect(claimCompanyScreeningRun).toHaveBeenCalledWith("acc-1", "scr-1");
    expect(completeCompanyScreening).toHaveBeenCalledOnce();
    expect(failCompanyScreening).not.toHaveBeenCalled();
    expect(screening.status).toBe("COMPLETED");
    expect(completeCompanyScreening.mock.calls[0]?.[2]?.payload.analysis).toBeDefined();
  });

  it("moves research failure to FAILED without a completed payload", async () => {
    const screening = await runQueuedCompanyScreening(
      "acc-1",
      "scr-1",
      ports({ web: new UnavailableWebResearchPort() }),
    );
    expect(failCompanyScreening).toHaveBeenCalledWith("acc-1", "scr-1", {
      code: WEB_RESEARCH_UNAVAILABLE,
      message: "No public-web research provider is configured.",
    });
    expect(completeCompanyScreening).not.toHaveBeenCalled();
    expect(screening.status).toBe("FAILED");
  });

  it("moves LLM failure to FAILED after research", async () => {
    const screening = await runQueuedCompanyScreening(
      "acc-1",
      "scr-1",
      ports({
        web: researchPort([{ title: "DATEV", url: "https://www.datev.de" }]),
        analysis: new UnavailableAnalysisPort(),
      }),
    );
    expect(failCompanyScreening).toHaveBeenCalledWith("acc-1", "scr-1", {
      code: LLM_API_KEY_MISSING,
      message: "LLM_API_KEY is not configured.",
    });
    expect(completeCompanyScreening).not.toHaveBeenCalled();
    expect(screening.status).toBe("FAILED");
  });

  it("does not start a second run when claim rejects a RUNNING screening", async () => {
    const { ConflictError } = await import("@/lib/db/serialize");
    claimCompanyScreeningRun.mockRejectedValue(
      new ConflictError("CompanyScreening is already RUNNING"),
    );
    await expect(
      runQueuedCompanyScreening(
        "acc-1",
        "scr-1",
        ports({
          catalog: memoryCatalog([datev]),
          web: researchPort([{ title: "DATEV", url: "https://www.datev.de" }]),
        }),
      ),
    ).rejects.toThrow(/already RUNNING/);
    expect(completeCompanyScreening).not.toHaveBeenCalled();
  });
});
