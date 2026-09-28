import { describe, expect, it, vi } from "vitest";
import { mockAnalysisPort } from "@/lib/analysis/mock";
import { BRAVE_API_KEY_MISSING, WEB_RESEARCH_NO_RESULTS } from "@/lib/screening/research/types";
import { executeScreeningPipeline } from "@/lib/screening/orchestrator";
import { UnavailableSalesIntelligenceAnalyzer } from "@/lib/screening/intelligence/unavailable-sales-analyzer";
import type { CompanyCatalogPort, IcpSourcePort } from "@/lib/screening/research/types";
import { BraveWebResearchAdapter } from "./adapter";
import type { BraveSearchClient } from "./client";

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

describe("BraveWebResearchAdapter", () => {
  it("does not pretend to search when the API key is missing", async () => {
    const adapter = new BraveWebResearchAdapter({ apiKey: null, gapMs: 0 });
    expect(adapter.available).toBe(false);
    expect(adapter.unavailableCode).toBe(BRAVE_API_KEY_MISSING);
    await expect(
      adapter.researchCompany({ name: "DATEV", domain: "datev.de" }),
    ).rejects.toMatchObject({ code: BRAVE_API_KEY_MISSING });
  });

  it("runs at most five sanitized queries and classifies official vs other sources", async () => {
    const search = vi.fn(async (query: string) => {
      if (query.startsWith("site:datev.de")) {
        return [
          {
            title: "DATEV Produkte",
            url: "https://www.datev.de/produkte",
            description: "Produkte",
            source: "www.datev.de",
          },
        ];
      }
      return [
        {
          title: "DATEV bei Handelsblatt",
          url: "https://www.handelsblatt.com/datev",
          description: "News",
          source: "www.handelsblatt.com",
        },
      ];
    });
    const adapter = new BraveWebResearchAdapter({
      client: { search } satisfies BraveSearchClient,
      gapMs: 0,
    });

    const finding = await adapter.researchCompany({ name: "DATEV", domain: "datev.de" });
    expect(search).toHaveBeenCalledTimes(5);
    expect(search.mock.calls[0]?.[0]).toContain("site:datev.de");
    expect(finding.research?.provider).toBe("brave");
    expect(finding.research?.queries).toHaveLength(5);
    expect(finding.research?.results.some((item) => item.sourceKind === "official")).toBe(true);
    expect(finding.research?.results.some((item) => item.sourceKind === "news")).toBe(true);
    expect(finding.profile).toEqual({});
  });
});

describe("Brave adapter through the screening pipeline", () => {
  it("completes with research results from the port and does not invent ICP or contacts", async () => {
    const adapter = new BraveWebResearchAdapter({
      gapMs: 0,
      client: {
        async search() {
          return [
            {
              title: "DATEV",
              url: "https://www.datev.de",
              description: "Öffentliche Unternehmensseite",
              source: "www.datev.de",
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
    expect(outcome.payload.research?.provider).toBe("brave");
    expect(outcome.payload.research?.results[0]?.url).toBe("https://www.datev.de");
    expect(outcome.payload.analysis?.companyProfile.summary).toContain("DATEV");
    expect(outcome.payload.icpAssessment).toBeUndefined();
    expect(outcome.payload.contacts).toBeUndefined();
    expect(outcome.payload.signals).toBeUndefined();
    expect(outcome.payload.salesHypotheses).toBeUndefined();
  });

  it("fails with no results instead of inventing a company", async () => {
    const adapter = new BraveWebResearchAdapter({
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
