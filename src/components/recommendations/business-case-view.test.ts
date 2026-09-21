import { describe, expect, it } from "vitest";
import {
  BUSINESS_CASE_EMPTY_MESSAGE,
  BUSINESS_CASE_FRAMING,
  businessCaseLabel,
  selectVisibleBusinessCases,
  toBusinessCasePresentation,
} from "./business-case-view";
import type {
  BusinessCaseHypothesis,
  RecommendationResult,
  ServiceRecommendation,
} from "@/lib/recommendation";

const FINANCIAL_CLAIM_PATTERN =
  /(\d[\d.\s]*\s*%|\d[\d.\s]*\s*€|\bEUR\b|\bEuro\b|500\.000|sparen Sie|Umsatzsteigerung um)/i;

function hypothesis(
  type: BusinessCaseHypothesis["type"],
  extras: Partial<BusinessCaseHypothesis> = {},
): BusinessCaseHypothesis {
  return {
    type,
    confidence: extras.confidence ?? 75,
    reasons: extras.reasons ?? [`Möglicher Business Case: ${businessCaseLabel(type)}`],
    supportingSignals: extras.supportingSignals ?? ["[DEMO] IT recruiting activity"],
    valuePropositions: extras.valuePropositions ?? [],
  };
}

function serviceRec(
  name: string,
  matchScore: number,
  cases: BusinessCaseHypothesis[],
  extras: Partial<ServiceRecommendation> = {},
): ServiceRecommendation {
  return {
    service: {
      name,
      targetIndustries: [],
      targetCompanySizes: [],
      targetRoles: [],
      matchingSignalTypes: [],
      conversationStarter: extras.conversationStarter ?? `Einstieg für ${name}`,
      isActive: true,
      valuePropositions: extras.service?.valuePropositions,
    },
    matchScore,
    reasons: extras.reasons ?? [`${name} passt zum Leistungsangebot`],
    matchedSignals: extras.matchedSignals ?? [],
    conversationStarter: extras.conversationStarter ?? `Einstieg für ${name}`,
    businessCases: cases,
    primaryBusinessCase: extras.primaryBusinessCase ?? cases[0] ?? null,
  };
}

function result(
  cases: BusinessCaseHypothesis[],
  recommendations: ServiceRecommendation[] = [],
  primary = cases.length === 1 ? cases[0]! : null,
): RecommendationResult {
  return {
    primaryRecommendation: recommendations[0] ?? null,
    alternativeRecommendations: recommendations.slice(1),
    recommendations,
    businessCases: cases,
    primaryBusinessCase: primary,
  };
}

describe("businessCaseLabel", () => {
  it("maps COST_REDUCTION to Kosten senken", () => {
    expect(businessCaseLabel("COST_REDUCTION")).toBe("Kosten senken");
  });

  it("maps REVENUE_GROWTH to Umsatz steigern", () => {
    expect(businessCaseLabel("REVENUE_GROWTH")).toBe("Umsatz steigern");
  });

  it("maps CAPACITY to Kapazität schaffen", () => {
    expect(businessCaseLabel("CAPACITY")).toBe("Kapazität schaffen");
  });

  it("maps RISK_REDUCTION to Risiko reduzieren", () => {
    expect(businessCaseLabel("RISK_REDUCTION")).toBe("Risiko reduzieren");
  });
});

describe("toBusinessCasePresentation", () => {
  it("renders a unique primary business case with service, VP and supporting signals", () => {
    const capacity = hypothesis("CAPACITY", {
      reasons: [
        "Möglicher Business Case: Kapazität schaffen",
        "Aktuelle IT-Rekrutierung deutet auf zusätzlichen Ressourcenbedarf hin",
      ],
      supportingSignals: ["[DEMO] IT recruiting activity"],
      valuePropositions: ["Zusätzliche Entwicklungskapazität bereitstellen"],
      confidence: 75,
    });
    const presentation = toBusinessCasePresentation(
      result(
        [capacity],
        [
          serviceRec("Individual Software", 78, [capacity], {
            conversationStarter: "Welche Systeme stehen als Nächstes an?",
          }),
        ],
      ),
      [
        {
          title: "[DEMO] IT recruiting activity",
          type: "IT_RECRUITING",
          detectedAt: "2026-09-16T10:00:00.000Z",
        },
      ],
    );

    expect(presentation.empty).toBe(false);
    expect(presentation.heading).toBe("Möglicher Business Case");
    expect(presentation.cases).toHaveLength(1);
    const view = presentation.cases[0]!;
    expect(view.type).toBe("CAPACITY");
    expect(view.label).toBe("Kapazität schaffen");
    expect(view.hypothesis).toContain("zusätzlichen Ressourcenbedarf");
    expect(view.confidence).toBe(75);
    expect(view.supportingSignals[0]).toMatchObject({
      title: "[DEMO] IT recruiting activity",
      type: "IT_RECRUITING",
      typeLabel: "IT-Recruiting",
    });
    expect(view.supportingSignals[0]?.detectedAt).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    expect(view.valueProposition).toBe("Zusätzliche Entwicklungskapazität bereitstellen");
    expect(view.serviceName).toBe("Individual Software");
    expect(view.serviceFit).toBe(78);
    expect(view.conversationStarter).toBe("Welche Systeme stehen als Nächstes an?");
  });

  it("keeps equal top cases instead of picking a winner", () => {
    const tied = [
      hypothesis("CAPACITY", { confidence: 77 }),
      hypothesis("COST_REDUCTION", { confidence: 77 }),
      hypothesis("REVENUE_GROWTH", { confidence: 77 }),
    ];
    expect(selectVisibleBusinessCases(result(tied, [], null)).map((item) => item.type)).toEqual([
      "CAPACITY",
      "COST_REDUCTION",
      "REVENUE_GROWTH",
    ]);

    const presentation = toBusinessCasePresentation(result(tied, [], null));
    expect(presentation.heading).toBe("Mögliche Business Cases");
    expect(presentation.cases.map((item) => item.label)).toEqual([
      "Kapazität schaffen",
      "Kosten senken",
      "Umsatz steigern",
    ]);
  });

  it("does not invent a business case when none is supported", () => {
    const presentation = toBusinessCasePresentation(result([], []));
    expect(presentation.empty).toBe(true);
    expect(presentation.cases).toEqual([]);
    expect(presentation.emptyMessage).toBe(BUSINESS_CASE_EMPTY_MESSAGE);
    expect(presentation.emptyMessage).not.toMatch(/Kosten senken|Umsatz steigern|sparen/);
  });

  it("does not invent a value proposition or financial claim", () => {
    const cases = [
      hypothesis("COST_REDUCTION", {
        reasons: [
          "Möglicher Business Case: Kosten senken",
          "Das Signal kann auf Potenzial zur Reduzierung manueller Aufwände hindeuten.",
        ],
        supportingSignals: ["[DEMO] Process automation assessment"],
        valuePropositions: [],
      }),
    ];
    const presentation = toBusinessCasePresentation(
      result(cases, [serviceRec("Camunda Migration", 60, cases)], cases[0]!),
    );
    const texts = [
      BUSINESS_CASE_FRAMING,
      ...presentation.cases.flatMap((item) => [
        item.label,
        item.hypothesis,
        item.valueProposition,
        ...item.supportingSignals.map((signal) => signal.title),
      ]),
    ];
    expect(presentation.cases[0]?.valueProposition).toBeNull();
    for (const text of texts) {
      if (!text) continue;
      expect(text).not.toMatch(FINANCIAL_CLAIM_PATTERN);
    }
  });

  it("connects the case to the recommended service with the highest fit", () => {
    const capacity = hypothesis("CAPACITY", {
      valuePropositions: ["Zusätzliche Entwicklungskapazität bereitstellen"],
    });
    const risk = hypothesis("RISK_REDUCTION", {
      confidence: 75,
      valuePropositions: ["Technische Risiken bestehender Altsysteme reduzieren"],
    });
    const presentation = toBusinessCasePresentation(
      result(
        [capacity],
        [
          serviceRec("Individual Software", 80, [
            { ...capacity, valuePropositions: ["Zusätzliche Entwicklungskapazität bereitstellen"] },
          ]),
          serviceRec("Cloud Migration", 70, [
            { ...risk, valuePropositions: ["Technische Risiken bestehender Altsysteme reduzieren"] },
          ]),
        ],
      ),
    );
    expect(presentation.cases[0]?.serviceName).toBe("Individual Software");
    expect(presentation.cases[0]?.serviceFit).toBe(80);
    expect(presentation.cases[0]?.valueProposition).toBe(
      "Zusätzliche Entwicklungskapazität bereitstellen",
    );
  });
});
