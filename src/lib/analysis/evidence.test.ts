import { describe, expect, it } from "vitest";
import { LLM_INVALID_OUTPUT } from "./errors";
import {
  allowedResearchUrls,
  normalizeEvidenceUrl,
  sanitizeScreeningAnalysis,
} from "./evidence";
import { mockScreeningAnalysis } from "./mock";
import type { ScreeningAnalysis } from "./types";

const allowed = [{ title: "DATEV", url: "https://www.datev.de/cloud", publishedAt: "2026-01-10" }];

function analysisWithUrls(urls: string[]): ScreeningAnalysis {
  const evidence = urls.map((url) => ({ url, title: "Quelle" }));
  return mockScreeningAnalysis(
    {
      company: { name: "DATEV" },
      research: { queries: [], results: allowed },
    },
    {
      companyProfile: {
        summary: "DATEV beschreibt Cloud-Aktivitäten.",
        industry: "Software",
        evidence,
      },
      facts: [
        {
          kind: "fact",
          statement: "DATEV beschreibt Cloud-Aktivitäten öffentlich.",
          evidence,
        },
      ],
      signals: [
        {
          type: "cloud",
          title: "Cloud",
          description: "Cloud-Migration",
          category: "cloud",
          strength: "high",
          evidence,
        },
      ],
      salesHypotheses: [
        {
          title: "Cloud-Bedarf",
          hypothesis: "DATEV könnte Modernisierungsbedarf haben.",
          rationale: "Cloud wird öffentlich beschrieben.",
          relevance: "medium",
          evidence,
        },
      ],
    },
  );
}

describe("evidence allowlist", () => {
  it("normalizes research URLs so www and trailing slashes still match", () => {
    expect(normalizeEvidenceUrl("https://www.datev.de/cloud/")).toBe("https://datev.de/cloud");
    expect(allowedResearchUrls(allowed).has("https://datev.de/cloud")).toBe(true);
  });

  it("keeps evidence URLs that come from the research results and copies publishedAt", () => {
    const sanitized = sanitizeScreeningAnalysis(
      analysisWithUrls(["https://www.datev.de/cloud/"]),
      allowed,
    );
    expect(sanitized.companyProfile.evidence[0]?.url).toBe("https://www.datev.de/cloud/");
    expect(sanitized.companyProfile.evidence[0]?.publishedAt).toBe("2026-01-10");
    expect(sanitized.signals).toHaveLength(1);
    expect(sanitized.salesHypotheses).toHaveLength(1);
  });

  it("rejects invented evidence URLs instead of silently dropping them", () => {
    expect(() =>
      sanitizeScreeningAnalysis(analysisWithUrls(["https://invented.example/datev"]), allowed),
    ).toThrow(
      expect.objectContaining({
        code: LLM_INVALID_OUTPUT,
      }),
    );
  });

  it("rejects a mixed set that contains any unknown URL", () => {
    const mixed = analysisWithUrls(["https://www.datev.de/cloud"]);
    mixed.signals.push({
      type: "hiring",
      title: "Erfunden",
      description: "Nicht belegt",
      category: "hiring",
      strength: "high",
      evidence: [{ url: "https://invented.example/jobs" }],
    });
    expect(() => sanitizeScreeningAnalysis(mixed, allowed)).toThrow(
      expect.objectContaining({ code: LLM_INVALID_OUTPUT }),
    );
  });
});
