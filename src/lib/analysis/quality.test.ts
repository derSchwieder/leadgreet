import { describe, expect, it } from "vitest";
import { LLM_INVALID_OUTPUT } from "./errors";
import { ICP_NOTE, sanitizeScreeningAnalysis } from "./evidence";
import { mockScreeningAnalysis } from "./mock";
import { parseLlmJson } from "./openai-client";
import type { ScreeningAnalysis, ScreeningAnalysisInput } from "./types";

const official = {
  title: "DATEV Geschäftsbericht",
  url: "https://www.datev.de/geschaeftszahlen",
  publishedAt: "2025-06-01",
};
const news = {
  title: "DATEV Umsatzbericht",
  url: "https://www.handelsblatt.com/datev-umsatz",
  publishedAt: "2023-03-15",
};

const research: ScreeningAnalysisInput["research"] = {
  queries: ["DATEV Umsatz"],
  results: [official, news],
};

function validAnalysis(): ScreeningAnalysis {
  const evidence = [{ url: official.url, title: official.title }];
  return mockScreeningAnalysis(
    { company: { name: "DATEV" }, research },
    {
      companyProfile: {
        summary: "DATEV ist ein Softwarehaus laut öffentlicher Quelle.",
        industry: "Software",
        evidence,
      },
      facts: [
        {
          kind: "fact",
          statement: "DATEV entwickelt sein Produktportfolio weiter in die Cloud.",
          evidence,
        },
      ],
      interpretations: [
        {
          kind: "interpretation",
          statement: "Die Cloud-Transformation ist ein strategisch relevantes Transformationsthema.",
          evidence,
        },
      ],
      signals: [
        {
          type: "cloud",
          title: "Cloud",
          description: "Cloud-Aktivitäten werden öffentlich beschrieben.",
          category: "cloud",
          strength: "medium",
          evidence,
        },
      ],
      salesHypotheses: [
        {
          title: "Cloud-Skalierung",
          hypothesis:
            "DATEV könnte Bedarf an Unterstützung bei der Skalierung cloudbasierter Plattformen haben.",
          rationale: "Die Quelle beschreibt den Ausbau cloudbasierter Produkte.",
          relevance: "medium",
          evidence,
        },
      ],
    },
  );
}

describe("analysis quality hardening", () => {
  it("TEST 1: valid analysis with evidence is accepted", () => {
    const sanitized = sanitizeScreeningAnalysis(validAnalysis(), research.results);
    expect(sanitized.facts[0]?.kind).toBe("fact");
    expect(sanitized.interpretations[0]?.kind).toBe("interpretation");
    expect(sanitized.signals).toHaveLength(1);
    expect(sanitized.salesHypotheses[0]?.hypothesis).toMatch(/könnte/);
    expect(sanitized.companyProfile.evidence[0]?.publishedAt).toBe("2025-06-01");
  });

  it("TEST 2: signal without evidence is rejected", () => {
    const analysis = validAnalysis();
    analysis.signals[0] = { ...analysis.signals[0]!, evidence: [] };
    expect(() => sanitizeScreeningAnalysis(analysis, research.results)).toThrow(
      expect.objectContaining({ code: LLM_INVALID_OUTPUT }),
    );
  });

  it("TEST 3: evidence URL missing from research results is rejected", () => {
    const analysis = validAnalysis();
    analysis.signals[0] = {
      ...analysis.signals[0]!,
      evidence: [{ url: "https://invented.example/datev" }],
    };
    expect(() => sanitizeScreeningAnalysis(analysis, research.results)).toThrow(
      expect.objectContaining({ code: LLM_INVALID_OUTPUT }),
    );
  });

  it("TEST 4a: sales hypothesis phrased as a possible need is accepted", () => {
    const analysis = validAnalysis();
    analysis.salesHypotheses[0] = {
      ...analysis.salesHypotheses[0]!,
      hypothesis: "Die Aktivitäten könnten auf einen möglichen Bedarf an Integrationsunterstützung hindeuten.",
    };
    expect(() => sanitizeScreeningAnalysis(analysis, research.results)).not.toThrow();
  });

  it("TEST 4b: sales hypothesis that asserts purchase intent is rejected", () => {
    const analysis = validAnalysis();
    analysis.salesHypotheses[0] = {
      ...analysis.salesHypotheses[0]!,
      hypothesis: "DATEV benötigt jetzt einen neuen Anbieter für Cloud-Migration.",
    };
    expect(() => sanitizeScreeningAnalysis(analysis, research.results)).toThrow(
      expect.objectContaining({
        code: LLM_INVALID_OUTPUT,
        message: "Sales hypotheses must be phrased as hypotheses, not purchase intent.",
      }),
    );
  });

  it("TEST 4c: sales hypothesis without a clear hypothesis marker is rejected", () => {
    const analysis = validAnalysis();
    analysis.salesHypotheses[0] = {
      ...analysis.salesHypotheses[0]!,
      hypothesis: "Cloud-Skalierung ist ein relevantes Thema für DATEV.",
    };
    expect(() => sanitizeScreeningAnalysis(analysis, research.results)).toThrow(
      expect.objectContaining({ code: LLM_INVALID_OUTPUT }),
    );
  });

  it("TEST 5: sales hypothesis without evidence is rejected", () => {
    const analysis = validAnalysis();
    analysis.salesHypotheses[0] = { ...analysis.salesHypotheses[0]!, evidence: [] };
    expect(() => sanitizeScreeningAnalysis(analysis, research.results)).toThrow(
      expect.objectContaining({ code: LLM_INVALID_OUTPUT }),
    );
  });

  it("TEST 5: conflicting revenue evidence is recorded and not resolved", () => {
    const analysis = validAnalysis();
    analysis.companyProfile.revenue = "1,65 Mrd. €";
    analysis.conflicts = [
      {
        topic: "revenue",
        status: "conflicting_evidence",
        values: [
          { value: "810,2 Mio. €", source: official.url, publishedAt: official.publishedAt },
          { value: "1,65 Mrd. €", source: news.url, publishedAt: news.publishedAt },
        ],
      },
    ];

    const sanitized = sanitizeScreeningAnalysis(analysis, research.results);
    expect(sanitized.conflicts).toEqual([
      {
        topic: "revenue",
        status: "conflicting_evidence",
        values: [
          { value: "810,2 Mio. €", source: official.url, publishedAt: official.publishedAt },
          { value: "1,65 Mrd. €", source: news.url, publishedAt: news.publishedAt },
        ],
      },
    ]);
    expect(sanitized.companyProfile.revenue).toBeUndefined();
    expect(sanitized.limitations).toContain(
      "Conflicting research evidence was recorded and not resolved.",
    );
  });

  it("TEST 6: unsupported company profile revenue is not accepted as a fact", () => {
    const analysis = validAnalysis();
    analysis.companyProfile.revenue = "1,65 Mrd. €";
    analysis.companyProfile.evidence = [];
    const sanitized = sanitizeScreeningAnalysis(analysis, research.results);
    expect(sanitized.companyProfile.revenue).toBeUndefined();
    expect(sanitized.companyProfile.industry).toBeUndefined();
  });

  it("TEST 7: ICP assessment is marked research-based without executing scoring", () => {
    const sanitized = sanitizeScreeningAnalysis(validAnalysis(), research.results);
    expect(sanitized.limitations).toContain(ICP_NOTE);
    expect(sanitized.limitations.join(" ")).not.toMatch(/ICP Score\s*=/);
    expect(sanitized.icpAssessment.summary).toContain("existing Leadgreet ICP scoring was not executed");
  });

  it("TEST 8: invalid LLM JSON is rejected as LLM_INVALID_OUTPUT", () => {
    expect(() => parseLlmJson("{not-json")).toThrow(
      expect.objectContaining({ code: LLM_INVALID_OUTPUT }),
    );
    expect(() => parseLlmJson(JSON.stringify({ companyProfile: {} }))).toThrow(
      expect.objectContaining({ code: LLM_INVALID_OUTPUT }),
    );
  });
});
