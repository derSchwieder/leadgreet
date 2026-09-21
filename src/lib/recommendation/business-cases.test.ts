import { describe, expect, it } from "vitest";
import { SEED_SERVICES } from "../../../prisma/seed-data";
import {
  attachBusinessCases,
  inferBusinessCases,
  MIN_BUSINESS_CASE_CONFIDENCE,
  recommendServices,
  scoreServiceMatch,
  selectPrimaryBusinessCase,
} from "./index";
import type { RecommendationOpportunity, RecommendationService } from "./types";

const FINANCIAL_CLAIM_PATTERN =
  /(\d[\d.\s]*\s*%|\d[\d.\s]*\s*€|\bEUR\b|\bEuro\b|500\.000|sparen Sie|Umsatzsteigerung um)/i;

function service(overrides: Partial<RecommendationService> = {}): RecommendationService {
  return {
    id: "svc-1",
    accountId: "account-a",
    name: "Individual Software",
    description: "Individuelle Softwareentwicklung",
    targetIndustries: ["manufacturing"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    targetRoles: ["CTO", "HEAD_OF_SOFTWARE", "CIO"],
    matchingSignalTypes: ["SOFTWARE_MODERNIZATION", "IT_RECRUITING", "PROCESS_AUTOMATION", "EXPANSION"],
    businessCaseTypes: ["CAPACITY", "REVENUE_GROWTH", "COST_REDUCTION"],
    valuePropositions: [
      "Zusätzliche Entwicklungskapazität bereitstellen",
      "Digitale Produkte schneller umsetzen",
      "Bestehende Anwendungen modernisieren",
      "Interne Teams bei der Umsetzung entlasten",
    ],
    conversationStarter: "Welche Systeme stehen als Nächstes an?",
    isActive: true,
    ...overrides,
  };
}

function opportunity(
  overrides: Partial<RecommendationOpportunity> = {},
): RecommendationOpportunity {
  return {
    company: {
      industry: "manufacturing",
      companySize: "LARGE",
      ...overrides.company,
    },
    signals: overrides.signals ?? [
      { type: "IT_RECRUITING", title: "47 offene Softwareentwickler-Stellen", signalStrength: 82 },
    ],
    recommendedContact:
      overrides.recommendedContact === undefined
        ? { role: "CTO" }
        : overrides.recommendedContact,
  };
}

function collectedTexts(
  hypotheses: ReturnType<typeof inferBusinessCases>,
): string[] {
  return hypotheses.flatMap((item) => [
    ...item.reasons,
    ...item.supportingSignals,
    ...item.valuePropositions,
  ]);
}

describe("business case hypotheses", () => {
  it("recognizes CAPACITY from IT_RECRUITING", () => {
    const cases = inferBusinessCases([
      { type: "IT_RECRUITING", title: "47 offene Softwareentwickler-Stellen", signalStrength: 82 },
    ]);
    expect(cases.map((item) => item.type)).toEqual(["CAPACITY"]);
    expect(cases[0]?.confidence).toBeGreaterThanOrEqual(MIN_BUSINESS_CASE_CONFIDENCE);
    expect(cases[0]?.reasons).toContain("Möglicher Business Case: Kapazität schaffen");
    expect(cases[0]?.reasons).toContain(
      "Aktuelle IT-Rekrutierung deutet auf zusätzlichen Ressourcenbedarf hin",
    );
    expect(selectPrimaryBusinessCase(cases)?.type).toBe("CAPACITY");
  });

  it("recognizes COST_REDUCTION from PROCESS_AUTOMATION", () => {
    const cases = inferBusinessCases([
      { type: "PROCESS_AUTOMATION", title: "Prozessautomatisierung im Einkauf", signalStrength: 80 },
    ]);
    expect(cases.map((item) => item.type)).toContain("COST_REDUCTION");
    expect(cases.find((item) => item.type === "COST_REDUCTION")?.reasons).toContain(
      "Möglicher Business Case: Kosten senken",
    );
  });

  it("recognizes REVENUE_GROWTH from EXPANSION", () => {
    const cases = inferBusinessCases([
      { type: "EXPANSION", title: "Neues Werk in Osteuropa", signalStrength: 78 },
    ]);
    expect(cases.map((item) => item.type)).toContain("REVENUE_GROWTH");
    expect(cases.find((item) => item.type === "REVENUE_GROWTH")?.reasons).toContain(
      "Ein Expansionssignal kann auf Umsatzwachstum als möglichen wirtschaftlichen Hebel hindeuten.",
    );
  });

  it("can recognize RISK_REDUCTION from SOFTWARE_MODERNIZATION", () => {
    const cases = inferBusinessCases([
      { type: "SOFTWARE_MODERNIZATION", title: "Ablösung der Legacy-Anwendung", signalStrength: 84 },
    ]);
    expect(cases.map((item) => item.type)).toContain("RISK_REDUCTION");
    expect(cases.find((item) => item.type === "RISK_REDUCTION")?.reasons).toContain(
      "Software-Modernisierung kann auf das Ziel hinweisen, technische Risiken zu reduzieren.",
    );
  });

  it("attaches a BusinessCaseHypothesis to a matching ServiceRecommendation", () => {
    const result = recommendServices({
      opportunity: opportunity(),
      services: [service()],
    });
    const recommendation = result.primaryRecommendation;
    expect(recommendation).not.toBeNull();
    expect(recommendation?.service.name).toBe("Individual Software");
    expect(recommendation?.businessCases.some((item) => item.type === "CAPACITY")).toBe(true);
    expect(recommendation?.primaryBusinessCase?.type).toBe("CAPACITY");
    expect(recommendation?.businessCases[0]?.valuePropositions).toContain(
      "Zusätzliche Entwicklungskapazität bereitstellen",
    );
  });

  it("lists supportingSignals from the observed signal titles", () => {
    const title = "47 offene Softwareentwickler-Stellen";
    const cases = inferBusinessCases([{ type: "IT_RECRUITING", title, signalStrength: 82 }]);
    expect(cases[0]?.supportingSignals).toEqual([title]);

    const result = recommendServices({
      opportunity: opportunity({
        signals: [{ type: "IT_RECRUITING", title, signalStrength: 82 }],
      }),
      services: [service()],
    });
    expect(result.primaryRecommendation?.businessCases[0]?.supportingSignals).toEqual([title]);
  });

  it("does not invent concrete financial claims", () => {
    const signals = [
      { type: "IT_RECRUITING" as const, title: "47 offene Softwareentwickler-Stellen", signalStrength: 82 },
      { type: "PROCESS_AUTOMATION" as const, title: "Prozessautomatisierung im Einkauf", signalStrength: 80 },
      { type: "EXPANSION" as const, title: "Neues Werk in Osteuropa", signalStrength: 78 },
      { type: "SOFTWARE_MODERNIZATION" as const, title: "Ablösung der Legacy-Anwendung", signalStrength: 84 },
      { type: "CLOUD_MIGRATION" as const, title: "Cloud-Umzug geplant", signalStrength: 86 },
      { type: "AI_PROJECT" as const, title: "Neues KI-Projekt", signalStrength: 92 },
    ];
    const texts = [
      ...collectedTexts(inferBusinessCases(signals)),
      ...SEED_SERVICES.flatMap((spec) => spec.valuePropositions),
    ];
    for (const text of texts) {
      expect(text).not.toMatch(FINANCIAL_CLAIM_PATTERN);
    }
  });

  it("keeps equally supported business cases instead of picking a winner", () => {
    const cases = inferBusinessCases([
      { type: "AI_PROJECT", title: "Neues KI-Projekt", signalStrength: 92 },
    ]);
    expect(cases.map((item) => item.type).sort()).toEqual([
      "CAPACITY",
      "COST_REDUCTION",
      "REVENUE_GROWTH",
    ]);
    const confidences = new Set(cases.map((item) => item.confidence));
    expect(confidences.size).toBe(1);
    expect(selectPrimaryBusinessCase(cases)).toBeNull();

    const result = recommendServices({
      opportunity: opportunity({
        signals: [{ type: "AI_PROJECT", title: "Neues KI-Projekt", signalStrength: 92 }],
        recommendedContact: { role: "CIO" },
      }),
      services: [
        service({
          name: "KI-Navigator",
          matchingSignalTypes: ["AI_PROJECT", "AI_STRATEGY", "GENAI"],
          businessCaseTypes: ["CAPACITY", "COST_REDUCTION", "REVENUE_GROWTH"],
          targetRoles: ["CIO", "CDO", "HEAD_OF_AI"],
        }),
      ],
    });
    expect(result.primaryBusinessCase).toBeNull();
    expect(result.primaryRecommendation?.primaryBusinessCase).toBeNull();
    expect(result.primaryRecommendation?.businessCases).toHaveLength(3);
  });

  it("returns null when no business case is sufficiently supported", () => {
    const cases = inferBusinessCases([
      { type: "OTHER", title: "Allgemeine Pressemeldung", signalStrength: 90 },
    ]);
    expect(cases).toEqual([]);
    expect(selectPrimaryBusinessCase(cases)).toBeNull();

    const result = recommendServices({
      opportunity: opportunity({
        signals: [{ type: "OTHER", title: "Allgemeine Pressemeldung", signalStrength: 90 }],
      }),
      services: [service({ matchingSignalTypes: ["OTHER", "IT_RECRUITING"] })],
    });
    expect(result.businessCases).toEqual([]);
    expect(result.primaryBusinessCase).toBeNull();
    expect(result.primaryRecommendation?.businessCases).toEqual([]);
    expect(result.primaryRecommendation?.primaryBusinessCase).toBeNull();
  });

  it("uses only the provided account's services for attached business cases", () => {
    const accountA = service({
      id: "svc-a",
      accountId: "account-a",
      name: "Individual Software",
      matchingSignalTypes: ["SOFTWARE_MODERNIZATION"],
      businessCaseTypes: ["CAPACITY"],
      valuePropositions: ["Zusätzliche Entwicklungskapazität bereitstellen"],
    });
    const accountB = service({
      id: "svc-b",
      accountId: "account-b",
      name: "Cloud Infrastructure",
      matchingSignalTypes: ["SOFTWARE_MODERNIZATION", "CLOUD_MIGRATION"],
      businessCaseTypes: ["RISK_REDUCTION", "COST_REDUCTION"],
      valuePropositions: ["Technische Risiken bestehender Altsysteme reduzieren"],
    });
    const opp = opportunity({
      signals: [
        { type: "SOFTWARE_MODERNIZATION", title: "Ablösung der Legacy-Anwendung", signalStrength: 84 },
      ],
    });

    const result = recommendServices({ opportunity: opp, services: [accountA] });
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]?.service.accountId).toBe("account-a");
    expect(result.recommendations.some((row) => row.service.id === accountB.id)).toBe(false);
    expect(result.recommendations[0]?.businessCases.map((item) => item.type)).toEqual(["CAPACITY"]);
    expect(result.businessCases.map((item) => item.type)).toContain("RISK_REDUCTION");
    expect(result.recommendations[0]?.businessCases.some((item) => item.type === "RISK_REDUCTION")).toBe(
      false,
    );
  });

  it("does not change the service match score", () => {
    const withoutCases = service({ businessCaseTypes: [], valuePropositions: [] });
    const withCases = service();
    const opp = opportunity();
    expect(scoreServiceMatch(withoutCases, opp).matchScore).toBe(
      scoreServiceMatch(withCases, opp).matchScore,
    );
  });
});

describe("attachBusinessCases", () => {
  it("does not invent a primary case when several remain equally plausible for the service", () => {
    const hypotheses = inferBusinessCases([
      { type: "PROCESS_AUTOMATION", title: "Prozessautomatisierung im Einkauf", signalStrength: 80 },
    ]);
    const attached = attachBusinessCases(
      service({ businessCaseTypes: ["COST_REDUCTION", "CAPACITY"] }),
      hypotheses,
    );
    expect(attached.businessCases.map((item) => item.type).sort()).toEqual([
      "CAPACITY",
      "COST_REDUCTION",
    ]);
    expect(attached.primaryBusinessCase).toBeNull();
  });
});
