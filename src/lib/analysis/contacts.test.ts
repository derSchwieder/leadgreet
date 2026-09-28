import { describe, expect, it } from "vitest";
import { LLM_INVALID_OUTPUT } from "./errors";
import { sanitizeScreeningAnalysis } from "./evidence";
import { mockScreeningAnalysis } from "./mock";
import type { ScreeningAnalysis, ScreeningRelevantContact } from "./types";

const source = {
  title: "Jens Tester, Chief Digital Officer at Schaeffler",
  url: "https://www.schaeffler.com/newsroom/jens-tester",
};
const candidate = {
  name: "Jens Tester",
  role: "Chief Digital Officer",
  company: "Schaeffler",
  sourceUrl: source.url,
  evidence: [{ url: source.url, title: source.title }],
  relevance: "high" as const,
  relevanceReason: "Die Funktion ist mit Digitale Transformation verbunden.",
  relatedSignals: ["Digitale Transformation"],
};

function analysisWithContact(contact: ScreeningRelevantContact): ScreeningAnalysis {
  return mockScreeningAnalysis(
    {
      company: { name: "Schaeffler" },
      research: { queries: [], results: [source] },
    },
    {
      relevantContacts: [contact],
    },
  );
}

describe("contact analysis allowlist", () => {
  it("rejects an invented person that was not in contact research", () => {
    expect(() =>
      sanitizeScreeningAnalysis(
        analysisWithContact({
          name: "Erfundene Person",
          role: "Chief Digital Officer",
          company: "Schaeffler",
          evidence: [{ url: source.url }],
          relevance: "high",
          relevanceReason: "Modellwissen",
          relatedSignals: [],
        }),
        [source],
        { contacts: { results: [source], candidates: [candidate] } },
      ),
    ).toThrow(expect.objectContaining({ code: LLM_INVALID_OUTPUT }));
  });

  it("rejects an invented contact URL", () => {
    expect(() =>
      sanitizeScreeningAnalysis(
        analysisWithContact({
          name: "Jens Tester",
          role: "Chief Digital Officer",
          company: "Schaeffler",
          evidence: [{ url: "https://invented.example/jens" }],
          relevance: "high",
          relevanceReason: "Die Funktion passt zum Signal.",
          relatedSignals: ["Digitale Transformation"],
        }),
        [source],
        { contacts: { results: [source], candidates: [candidate] } },
      ),
    ).toThrow(expect.objectContaining({ code: LLM_INVALID_OUTPUT }));
  });

  it("keeps a researched contact and does not invent fields", () => {
    const sanitized = sanitizeScreeningAnalysis(
      analysisWithContact({
        name: "Jens Tester",
        role: "should be replaced",
        company: "Other",
        evidence: [{ url: source.url }],
        relevance: "medium",
        relevanceReason:
          "Relevant, weil die Person laut öffentlicher Quelle für Digitalization verantwortlich ist.",
        relatedSignals: ["Digitale Transformation"],
      }),
      [source],
      { contacts: { results: [source], candidates: [candidate] } },
    );
    expect(sanitized.relevantContacts).toEqual([
      expect.objectContaining({
        name: "Jens Tester",
        role: "Chief Digital Officer",
        company: "Schaeffler",
        relevance: "medium",
      }),
    ]);
  });
});
