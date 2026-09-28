import { describe, expect, it } from "vitest";
import { createConfiguredAnalysisPort, UnavailableAnalysisPort } from "./analysis-port";
import { AnalysisError, LLM_API_KEY_MISSING, LLM_INVALID_OUTPUT, LLM_PROVIDER_ERROR } from "./errors";
import { mockAnalysisPort, mockScreeningAnalysis } from "./mock";
import { createOpenAiAnalysisAdapter } from "./openai-adapter";
import type { ScreeningAnalysis, ScreeningAnalysisInput } from "./types";

const researchUrl = "https://www.datev.de";

function input(): ScreeningAnalysisInput {
  return {
    company: { name: "DATEV", domain: "datev.de" },
    research: {
      queries: ["DATEV Unternehmen"],
      results: [{ title: "DATEV", url: researchUrl }],
    },
    icp: { industries: ["Software"], countries: ["DE"] },
  };
}

function validAnalysis(url = researchUrl): ScreeningAnalysis {
  const evidence = [{ url, title: "DATEV" }];
  return mockScreeningAnalysis(input(), {
    companyProfile: {
      summary: "DATEV ist ein Softwarehaus laut öffentlicher Quelle.",
      industry: "Software",
      evidence,
    },
    icpAssessment: {
      criteria: [
        {
          criterion: "industry",
          finding: "Branche nur als Evidenz-Mapping, ohne matchesIcp.",
          status: "unknown",
          evidence,
        },
      ],
      summary: "Bestehendes matchesIcp-Scoring wurde nicht ausgeführt.",
      confidence: "low",
      evidence,
    },
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
    salesHypotheses: [],
  });
}

describe("AnalysisPort", () => {
  it("returns a structured analysis for valid research input", async () => {
    const port = mockAnalysisPort();
    const analysis = await port.analyze(input());
    expect(analysis.companyProfile.summary).toContain("DATEV");
    expect(analysis.icpAssessment.confidence).toBe("low");
    expect(analysis.companyProfile.evidence[0]?.url).toBe(researchUrl);
  });

  it("accepts valid structured output from a mocked provider", async () => {
    const port = createOpenAiAnalysisAdapter({
      client: {
        async completeJson() {
          return validAnalysis();
        },
      },
    });
    const analysis = await port.analyze(input());
    expect(analysis.companyProfile.industry).toBe("Software");
    expect(analysis.signals).toHaveLength(1);
    expect(analysis.limitations.some((item) => /ICP scoring was not executed/.test(item))).toBe(
      true,
    );
  });

  it("rejects invented evidence URLs", async () => {
    const port = createOpenAiAnalysisAdapter({
      client: {
        async completeJson() {
          return validAnalysis("https://invented.example/datev");
        },
      },
    });
    await expect(port.analyze(input())).rejects.toMatchObject({
      name: "AnalysisError",
      code: LLM_INVALID_OUTPUT,
    });
  });

  it("fails when the API key is missing", async () => {
    const port = new UnavailableAnalysisPort();
    expect(port.available).toBe(false);
    expect(port.unavailableCode).toBe(LLM_API_KEY_MISSING);
    await expect(port.analyze(input())).rejects.toBeInstanceOf(AnalysisError);
    await expect(port.analyze(input())).rejects.toMatchObject({ code: LLM_API_KEY_MISSING });
  });

  it("surfaces a provider error from the mocked client", async () => {
    const port = createOpenAiAnalysisAdapter({
      client: {
        async completeJson() {
          throw new AnalysisError(LLM_PROVIDER_ERROR, "upstream down");
        },
      },
    });
    await expect(port.analyze(input())).rejects.toMatchObject({ code: LLM_PROVIDER_ERROR });
  });

  it("uses the unavailable port when LLM_API_KEY is empty", () => {
    const previous = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;
    try {
      const port = createConfiguredAnalysisPort();
      expect(port).toBeInstanceOf(UnavailableAnalysisPort);
      expect(port.available).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.LLM_API_KEY;
      else process.env.LLM_API_KEY = previous;
    }
  });
});
