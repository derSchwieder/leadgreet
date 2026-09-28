import { describe, expect, it } from "vitest";
import { buildScreeningResult, mergeProfiles } from "./result-builder";

describe("buildScreeningResult", () => {
  it("does not fill gaps with invented web facts", () => {
    expect(
      mergeProfiles(
        { companyName: "DATEV eG", industry: null },
        { companyName: "Other", industry: "Software" },
      ),
    ).toEqual({
      companyName: "DATEV eG",
      domain: null,
      description: null,
      industry: "Software",
      headquarters: null,
      countries: null,
      employeeCount: null,
      revenue: null,
      ownership: null,
      companyType: null,
      businessModel: null,
      products: null,
    });
  });

  it("records coverage and limitations instead of silent success", () => {
    const payload = buildScreeningResult({
      profile: { companyName: "DATEV eG" },
      icpAssessment: { overallFit: true },
      signals: [],
      contacts: [],
      salesHypotheses: [],
      sources: [{ title: "DATEV", url: null, publisher: "Leadgreet Katalog", publishedAt: null }],
      localAvailable: true,
      webAvailable: false,
      llmAvailable: false,
    });
    expect(payload.coverage).toBe("local_catalog");
    expect(payload.salesHypotheses).toEqual([]);
    expect(payload.limitations).toEqual([
      "Web research is not configured. No public-web facts were added.",
      "LLM analysis is not configured. No sales hypotheses were generated.",
    ]);
    expect(payload.sources).toHaveLength(1);
  });
});
