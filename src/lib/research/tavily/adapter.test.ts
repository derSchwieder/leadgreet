import { describe, expect, it, vi } from "vitest";
import { mockAnalysisPort } from "@/lib/analysis/mock";
import { executeScreeningPipeline } from "@/lib/screening/orchestrator";
import { UnavailableSalesIntelligenceAnalyzer } from "@/lib/screening/intelligence/unavailable-sales-analyzer";
import {
  TAVILY_API_KEY_MISSING,
  WEB_RESEARCH_NO_RESULTS,
  type CompanyCatalogPort,
  type IcpSourcePort,
} from "@/lib/screening/research/types";
import { TavilyWebResearchAdapter } from "./adapter";
import type { TavilySearchClient } from "./client";

const emptyCatalog: CompanyCatalogPort = {
  async findByNameOrDomain() {
    return null;
  },
  async listSignals() {
    return [];
  },
};

const icp: IcpSourcePort = {
  async getProfile() {
    return {};
  },
};

describe("TavilyWebResearchAdapter", () => {
  it("does not pretend to search when the API key is missing", async () => {
    const adapter = new TavilyWebResearchAdapter({ apiKey: null, gapMs: 0 });
    expect(adapter.available).toBe(false);
    expect(adapter.unavailableCode).toBe(TAVILY_API_KEY_MISSING);
    await expect(
      adapter.researchCompany({ name: "DATEV", domain: "datev.de" }),
    ).rejects.toMatchObject({ code: TAVILY_API_KEY_MISSING });
  });

  it("normalizes Tavily hits onto WebResearchResult and keeps the existing query set", async () => {
    const search = vi.fn(async (query: string) => {
      if (query.startsWith("site:datev.de")) {
        return [
          {
            title: "DATEV Produkte",
            url: "https://www.datev.de/produkte",
            description: "Produkte",
            source: "datev.de",
          },
        ];
      }
      return [
        {
          title: "DATEV bei Handelsblatt",
          url: "https://www.handelsblatt.com/datev",
          description: "News",
          source: "handelsblatt.com",
        },
      ];
    });
    const adapter = new TavilyWebResearchAdapter({
      client: { search } satisfies TavilySearchClient,
      gapMs: 0,
    });

    const finding = await adapter.researchCompany({ name: "DATEV", domain: "datev.de" });
    expect(search).toHaveBeenCalledTimes(5);
    expect(search.mock.calls[0]?.[0]).toContain("site:datev.de");
    expect(finding.research?.provider).toBe("tavily");
    expect(finding.research?.queries).toHaveLength(5);
    expect(finding.research?.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "DATEV Produkte",
          url: "https://www.datev.de/produkte",
          sourceKind: "official",
        }),
        expect.objectContaining({
          url: "https://www.handelsblatt.com/datev",
          sourceKind: "news",
        }),
      ]),
    );
    expect(finding.profile).toEqual({});
  });
});

describe("Tavily adapter through the screening pipeline", () => {
  it("completes with research results and does not invent ICP or contacts", async () => {
    const adapter = new TavilyWebResearchAdapter({
      gapMs: 0,
      client: {
        async search() {
          return [
            {
              title: "DATEV",
              url: "https://www.datev.de",
              description: "Öffentliche Unternehmensseite",
              source: "datev.de",
            },
          ];
        },
      },
    });

    const outcome = await executeScreeningPipeline(
      {
        catalog: emptyCatalog,
        web: adapter,
        icp,
        sales: new UnavailableSalesIntelligenceAnalyzer(),
        analysis: mockAnalysisPort(),
      },
      { accountId: "acc-1", name: "DATEV", domain: "datev.de" },
    );

    expect(outcome.status).toBe("COMPLETED");
    if (outcome.status !== "COMPLETED") return;
    expect(outcome.payload.research?.provider).toBe("tavily");
    expect(outcome.payload.research?.results[0]?.url).toBe("https://www.datev.de");
    expect(outcome.payload.analysis?.companyProfile.summary).toContain("DATEV");
    expect(outcome.payload.icpAssessment).toBeUndefined();
    expect(outcome.payload.contacts).toBeUndefined();
    expect(outcome.payload.signals).toBeUndefined();
    expect(outcome.payload.salesHypotheses).toBeUndefined();
  });

  it("fails with no results instead of inventing a company", async () => {
    const adapter = new TavilyWebResearchAdapter({
      gapMs: 0,
      client: {
        async search() {
          return [];
        },
      },
    });
    const outcome = await executeScreeningPipeline(
      {
        catalog: emptyCatalog,
        web: adapter,
        icp,
        sales: new UnavailableSalesIntelligenceAnalyzer(),
        analysis: mockAnalysisPort(),
      },
      { accountId: "acc-1", name: "DATEV" },
    );
    expect(outcome).toMatchObject({
      status: "FAILED",
      code: WEB_RESEARCH_NO_RESULTS,
    });
  });
});
