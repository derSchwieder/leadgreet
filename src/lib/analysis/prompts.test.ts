import { describe, expect, it } from "vitest";
import { buildScreeningAnalysisUserPrompt, SCREENING_ANALYSIS_SYSTEM_PROMPT } from "./prompts";

describe("screening analysis prompt", () => {
  it("requires facts, interpretations, hypotheses, and research-only URLs", () => {
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain("Du bist die Analysekomponente von Leadgreet.");
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain("Erfinde keine Fakten.");
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain("Fakt");
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain("Interpretation");
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain("Sales-Hypothese");
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain(
      "Verwende ausschließlich URLs aus den bereitgestellten Quellen.",
    );
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain("FACT");
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain("conflicts[]");
    expect(SCREENING_ANALYSIS_SYSTEM_PROMPT).toContain(
      "existing Leadgreet ICP scoring was not executed",
    );
  });

  it("lists only the supplied research URLs in the user prompt", () => {
    const prompt = buildScreeningAnalysisUserPrompt({
      company: { name: "DATEV", domain: "datev.de" },
      research: {
        queries: ["DATEV Cloud"],
        results: [{ title: "DATEV", url: "https://www.datev.de", publishedAt: "2026-02-01" }],
      },
      icp: { industries: ["Software"] },
    });
    expect(prompt).toContain("https://www.datev.de");
    expect(prompt).toContain("Veröffentlicht: 2026-02-01");
    expect(prompt).not.toContain("https://invented.example");
    expect(prompt).toContain("kein Leadgreet ICP-Scoring");
  });
});
