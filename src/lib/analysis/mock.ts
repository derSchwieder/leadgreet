import { ICP_NOTE } from "./evidence";
import type { AnalysisPort, ScreeningAnalysis, ScreeningAnalysisInput } from "./types";

export function mockScreeningAnalysis(
  input?: Partial<ScreeningAnalysisInput>,
  overrides?: Partial<ScreeningAnalysis>,
): ScreeningAnalysis {
  const url = input?.research?.results[0]?.url ?? "https://www.datev.de";
  const title = input?.research?.results[0]?.title ?? "DATEV";
  const publishedAt = input?.research?.results[0]?.publishedAt ?? undefined;
  const evidence = [{ url, title, publishedAt }];
  return {
    companyProfile: {
      summary: `${input?.company?.name ?? "Unternehmen"} laut öffentlicher Recherche.`,
      industry: "Software",
      evidence,
    },
    facts: [
      {
        kind: "fact",
        statement: `${input?.company?.name ?? "Das Unternehmen"} wird in den Research-Ergebnissen öffentlich beschrieben.`,
        evidence,
      },
    ],
    interpretations: [],
    icpAssessment: {
      criteria: [
        {
          criterion: "industry",
          finding: "Branche nur als Evidenz-Mapping, ohne Leadgreet ICP-Scoring.",
          status: "unknown",
          evidence,
        },
      ],
      summary: ICP_NOTE,
      confidence: "low",
      evidence,
    },
    signals: [],
    salesHypotheses: [],
    relevantContacts: [],
    conflicts: [],
    limitations: [ICP_NOTE],
    ...overrides,
  };
}

export function mockAnalysisPort(
  overrides?: Partial<ScreeningAnalysis> | ((input: ScreeningAnalysisInput) => ScreeningAnalysis),
): AnalysisPort {
  return {
    available: true,
    provider: "mock",
    async analyze(input) {
      if (typeof overrides === "function") return overrides(input);
      return mockScreeningAnalysis(input, overrides);
    },
  };
}
