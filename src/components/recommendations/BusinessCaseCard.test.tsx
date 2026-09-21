import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BusinessCaseCard } from "./BusinessCaseCard";
import {
  BUSINESS_CASE_EMPTY_MESSAGE,
  BUSINESS_CASE_FRAMING,
  toBusinessCasePresentation,
} from "./business-case-view";
import type { BusinessCaseHypothesis, RecommendationResult, ServiceRecommendation } from "@/lib/recommendation";

function hypothesis(
  type: BusinessCaseHypothesis["type"],
  extras: Partial<BusinessCaseHypothesis> = {},
): BusinessCaseHypothesis {
  return {
    type,
    confidence: extras.confidence ?? 75,
    reasons: extras.reasons ?? [`Möglicher Business Case: ${type}`],
    supportingSignals: extras.supportingSignals ?? ["[DEMO] IT recruiting activity"],
    valuePropositions: extras.valuePropositions ?? ["Zusätzliche Entwicklungskapazität bereitstellen"],
  };
}

function rec(cases: BusinessCaseHypothesis[]): ServiceRecommendation {
  return {
    service: {
      name: "Individual Software",
      targetIndustries: [],
      targetCompanySizes: [],
      targetRoles: [],
      matchingSignalTypes: [],
      conversationStarter: "Welche Systeme stehen als Nächstes an?",
      isActive: true,
    },
    matchScore: 78,
    reasons: ["IT-Recruiting passt zum Leistungsangebot"],
    matchedSignals: ["[DEMO] IT recruiting activity"],
    conversationStarter: "Welche Systeme stehen als Nächstes an?",
    businessCases: cases,
    primaryBusinessCase: cases[0] ?? null,
  };
}

function result(
  cases: BusinessCaseHypothesis[],
  recommendations: ServiceRecommendation[],
  primary: BusinessCaseHypothesis | null,
): RecommendationResult {
  return {
    primaryRecommendation: recommendations[0] ?? null,
    alternativeRecommendations: recommendations.slice(1),
    recommendations,
    businessCases: cases,
    primaryBusinessCase: primary,
  };
}

describe("BusinessCaseCard", () => {
  it("renders a compact case with evidence collapsed behind Warum", () => {
    const capacity = hypothesis("CAPACITY", {
      reasons: [
        "Möglicher Business Case: Kapazität schaffen",
        "Aktuelle IT-Rekrutierung deutet auf zusätzlichen Ressourcenbedarf hin",
      ],
    });
    const html = renderToStaticMarkup(
      <BusinessCaseCard
        presentation={toBusinessCasePresentation(
          result([capacity], [rec([capacity])], capacity),
          [
            {
              title: "[DEMO] IT recruiting activity",
              type: "IT_RECRUITING",
              detectedAt: "2026-09-16T10:00:00.000Z",
            },
          ],
        )}
      />,
    );

    expect(html).toContain("Mögliche Business Cases");
    expect(html).toContain("Kapazität schaffen");
    expect(html).toContain("Aktuelle IT-Rekrutierung deutet auf zusätzlichen Ressourcenbedarf hin");
    expect(html).toContain("Warum?");
    expect(html).toContain(BUSINESS_CASE_FRAMING);
    expect(html).toContain("IT-Recruiting");
    expect(html).toContain("Aktualität");
    expect(html).toContain("Passender Ansatz");
    expect(html).toContain("Zusätzliche Entwicklungskapazität bereitstellen");
    expect(html).toContain("Signalunterstützung");
    expect(html).not.toContain("<details open");
    expect(html).not.toContain("Chancenbewertung");
    expect(html).not.toMatch(/20\s*%|500\.000|€/);
    expect(html.indexOf("Warum?")).toBeGreaterThan(
      html.indexOf("Aktuelle IT-Rekrutierung deutet auf zusätzlichen Ressourcenbedarf hin"),
    );
  });

  it("renders equal cases without choosing a winner", () => {
    const tied = [
      hypothesis("CAPACITY", { confidence: 77, valuePropositions: [] }),
      hypothesis("COST_REDUCTION", { confidence: 77, valuePropositions: [] }),
    ];
    const html = renderToStaticMarkup(
      <BusinessCaseCard presentation={toBusinessCasePresentation(result(tied, [], null))} />,
    );
    expect(html).toContain("Mögliche Business Cases");
    expect(html).toContain("Kapazität schaffen");
    expect(html).toContain("Kosten senken");
    expect(html).not.toContain("Umsatz steigern");
  });

  it("shows a discreet empty message instead of inventing a case", () => {
    const html = renderToStaticMarkup(
      <BusinessCaseCard presentation={toBusinessCasePresentation(result([], [], null))} />,
    );
    expect(html).toContain(BUSINESS_CASE_EMPTY_MESSAGE);
    expect(html).not.toContain("Kosten senken");
    expect(html).not.toContain("Passender Ansatz");
    expect(html).not.toContain("Warum?");
  });
});
