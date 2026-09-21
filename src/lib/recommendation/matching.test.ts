import { describe, expect, it } from "vitest";
import { SEED_SERVICES } from "../../../prisma/seed-data";
import {
  MIN_RECOMMENDATION_SCORE,
  recommendServices,
  scoreServiceMatch,
} from "./matching";
import type { RecommendationOpportunity, RecommendationService } from "./types";

function service(overrides: Partial<RecommendationService> = {}): RecommendationService {
  return {
    id: "svc-1",
    accountId: "account-a",
    name: "KI-Navigator",
    description: "KI-Reifegradanalyse",
    targetIndustries: ["manufacturing", "automotive"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    targetRoles: ["CIO", "CDO", "HEAD_OF_AI"],
    matchingSignalTypes: ["AI_PROJECT", "AI_STRATEGY", "GENAI"],
    conversationStarter: "Wo steht das Unternehmen aktuell beim Thema KI?",
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
      { type: "AI_PROJECT", title: "Neues KI-Projekt", signalStrength: 92 },
    ],
    recommendedContact:
      overrides.recommendedContact === undefined
        ? { role: "HEAD_OF_AI" }
        : overrides.recommendedContact,
  };
}

function cloudService(overrides: Partial<RecommendationService> = {}): RecommendationService {
  return service({
    id: "svc-cloud",
    name: "Cloud Migration",
    matchingSignalTypes: ["CLOUD_MIGRATION", "SOFTWARE_MODERNIZATION"],
    targetRoles: ["CIO", "CTO", "HEAD_OF_IT"],
    conversationStarter: "Welche Workloads stehen für die Cloud-Migration an?",
    ...overrides,
  });
}

function seedServicesForAccount(accountId: string): RecommendationService[] {
  return SEED_SERVICES.map((spec, index) => ({
    id: `seed-${index}`,
    accountId,
    name: spec.name,
    description: spec.description,
    targetIndustries: spec.targetIndustries,
    targetCompanySizes: spec.targetCompanySizes,
    targetRoles: spec.targetRoles,
    matchingSignalTypes: spec.matchingSignalTypes,
    businessCaseTypes: spec.businessCaseTypes,
    valuePropositions: spec.valuePropositions,
    conversationStarter: spec.conversationStarter,
    isActive: true,
  }));
}

describe("recommendation matching", () => {
  it("scores a KI signal against KI-Navigator as a high match", () => {
    const match = scoreServiceMatch(service(), opportunity());
    expect(match.matchScore).toBeGreaterThanOrEqual(80);
    expect(match.reasons).toContain("KI-Projekt passt zum Leistungsangebot");
    expect(match.matchedSignals).toContain("Neues KI-Projekt");

    const result = recommendServices({
      opportunity: opportunity(),
      services: [service()],
    });
    expect(result.primaryRecommendation?.service.name).toBe("KI-Navigator");
    expect(result.primaryRecommendation?.matchScore).toBeGreaterThanOrEqual(80);
  });

  it("scores a cloud migration signal against Cloud Migration as a high match", () => {
    const opp = opportunity({
      signals: [{ type: "CLOUD_MIGRATION", title: "Cloud-Umzug geplant", signalStrength: 86 }],
      recommendedContact: { role: "CIO" },
    });
    const match = scoreServiceMatch(cloudService(), opp);
    expect(match.matchScore).toBeGreaterThanOrEqual(80);
    expect(match.reasons).toContain("Cloud-Migrationssignal passt zum Service");

    const result = recommendServices({ opportunity: opp, services: [cloudService()] });
    expect(result.primaryRecommendation?.service.name).toBe("Cloud Migration");
  });

  it("increases the match when the industry fits", () => {
    const withIndustry = scoreServiceMatch(service(), opportunity());
    const withoutIndustry = scoreServiceMatch(
      service(),
      opportunity({ company: { industry: "logistics", companySize: "LARGE" } }),
    );
    expect(withIndustry.matchScore).toBeGreaterThan(withoutIndustry.matchScore);
    expect(withIndustry.reasons).toContain("Branche entspricht dem Zielprofil");
    expect(withoutIndustry.reasons).not.toContain("Branche entspricht dem Zielprofil");
  });

  it("increases the match when the company size fits", () => {
    const withSize = scoreServiceMatch(service(), opportunity());
    const withoutSize = scoreServiceMatch(
      service(),
      opportunity({ company: { industry: "manufacturing", companySize: "STARTUP" } }),
    );
    expect(withSize.matchScore).toBeGreaterThan(withoutSize.matchScore);
    expect(withSize.reasons).toContain("Unternehmensgröße entspricht dem Zielprofil");
  });

  it("increases the match when the contact role fits", () => {
    const withRole = scoreServiceMatch(service(), opportunity());
    const withoutRole = scoreServiceMatch(
      service(),
      opportunity({ recommendedContact: { role: "CEO" } }),
    );
    expect(withRole.matchScore).toBeGreaterThan(withoutRole.matchScore);
    expect(withRole.reasons).toContain("Ansprechpartner passt zur Zielrolle");
  });

  it("scores multiple matching factors higher than a single factor", () => {
    const single = scoreServiceMatch(
      service({
        targetIndustries: [],
        targetCompanySizes: [],
        targetRoles: [],
      }),
      opportunity({ recommendedContact: null }),
    );
    const multiple = scoreServiceMatch(service(), opportunity());
    expect(multiple.matchScore).toBeGreaterThan(single.matchScore);
    expect(multiple.reasons.length).toBeGreaterThan(single.reasons.length);
  });

  it("does not recommend a service below the minimum score", () => {
    const result = recommendServices({
      opportunity: opportunity({
        signals: [{ type: "FUNDING", title: "Finanzierungsrunde", signalStrength: 40 }],
        recommendedContact: { role: "CEO" },
        company: { industry: "retail", companySize: "STARTUP" },
      }),
      services: [service()],
    });
    expect(result.primaryRecommendation).toBeNull();
    expect(result.recommendations).toEqual([]);
    expect(result.alternativeRecommendations).toEqual([]);
    expect(MIN_RECOMMENDATION_SCORE).toBe(55);
  });

  it("ignores inactive services", () => {
    const result = recommendServices({
      opportunity: opportunity(),
      services: [service({ isActive: false })],
    });
    expect(result.recommendations).toEqual([]);
    expect(result.primaryRecommendation).toBeNull();
  });

  it("never includes services that were not provided for the account", () => {
    const accountA = service({ id: "a", accountId: "account-a", name: "KI-Navigator" });
    const accountB = cloudService({
      id: "b",
      accountId: "account-b",
      name: "Cloud Infrastructure",
    });
    const result = recommendServices({
      opportunity: opportunity(),
      services: [accountA],
    });
    expect(result.recommendations.map((row) => row.service.accountId)).toEqual(["account-a"]);
    expect(result.recommendations.some((row) => row.service.id === accountB.id)).toBe(false);
    expect(result.recommendations.some((row) => row.service.name === "Cloud Infrastructure")).toBe(
      false,
    );
  });

  it("works without a recommended contact", () => {
    const match = scoreServiceMatch(service(), opportunity({ recommendedContact: null }));
    expect(match.matchScore).toBeGreaterThanOrEqual(MIN_RECOMMENDATION_SCORE);
    expect(match.reasons).not.toContain("Ansprechpartner passt zur Zielrolle");

    const result = recommendServices({
      opportunity: opportunity({ recommendedContact: null }),
      services: [service()],
    });
    expect(result.primaryRecommendation).not.toBeNull();
  });

  it("does not penalize a service without target industries", () => {
    const emptyTargets = scoreServiceMatch(service({ targetIndustries: [] }), opportunity());
    const mismatch = scoreServiceMatch(
      service(),
      opportunity({ company: { industry: "retail", companySize: "LARGE" } }),
    );
    expect(emptyTargets.matchScore).toBeGreaterThanOrEqual(mismatch.matchScore);
    expect(emptyTargets.reasons).not.toContain("Branche entspricht dem Zielprofil");
  });

  it("does not penalize a service without target company sizes", () => {
    const emptyTargets = scoreServiceMatch(service({ targetCompanySizes: [] }), opportunity());
    const mismatch = scoreServiceMatch(
      service(),
      opportunity({ company: { industry: "manufacturing", companySize: "STARTUP" } }),
    );
    expect(emptyTargets.matchScore).toBeGreaterThanOrEqual(mismatch.matchScore);
  });

  it("does not penalize a service without target roles", () => {
    const emptyTargets = scoreServiceMatch(service({ targetRoles: [] }), opportunity());
    const mismatch = scoreServiceMatch(
      service(),
      opportunity({ recommendedContact: { role: "CEO" } }),
    );
    expect(emptyTargets.matchScore).toBeGreaterThanOrEqual(mismatch.matchScore);
  });

  it("uses diminishing returns for additional matching signals", () => {
    const one = scoreServiceMatch(service(), opportunity());
    const two = scoreServiceMatch(
      service(),
      opportunity({
        signals: [
          { type: "AI_PROJECT", title: "Neues KI-Projekt", signalStrength: 92 },
          { type: "AI_STRATEGY", title: "Neue AI-Verantwortlichkeit", signalStrength: 88 },
        ],
      }),
    );
    const many = scoreServiceMatch(
      service(),
      opportunity({
        signals: [
          { type: "AI_PROJECT", title: "Neues KI-Projekt", signalStrength: 92 },
          { type: "AI_STRATEGY", title: "Neue AI-Verantwortlichkeit", signalStrength: 88 },
          { type: "GENAI", title: "GenAI-Pilot", signalStrength: 90 },
        ],
      }),
    );
    expect(two.matchScore).toBeGreaterThan(one.matchScore);
    expect(many.matchScore).toBeGreaterThanOrEqual(two.matchScore);
    expect(many.matchScore).toBeLessThanOrEqual(100);
    expect(two.reasons).toContain("Mehrere passende Signale erkannt");
  });

  it("is deterministic for the same input", () => {
    const input = { opportunity: opportunity(), services: [service(), cloudService()] };
    expect(recommendServices(input)).toEqual(recommendServices(input));
  });

  it("recommends KI-Navigator and Data & AI for a KI demo opportunity from seed services", () => {
    const result = recommendServices({
      opportunity: opportunity({
        signals: [
          { type: "AI_PROJECT", title: "[DEMO] AI project exploration", signalStrength: 92 },
          { type: "GENAI", title: "[DEMO] Generative AI capability review", signalStrength: 90 },
        ],
        recommendedContact: { role: "CIO" },
      }),
      services: seedServicesForAccount("demo"),
    });
    const names = result.recommendations.map((row) => row.service.name);
    expect(names).toContain("KI-Navigator");
    expect(names).toContain("Data & AI");
    expect(result.primaryRecommendation).not.toBeNull();
    expect(result.primaryRecommendation?.matchScore).toBeGreaterThanOrEqual(80);
    expect(result.recommendations.find((row) => row.service.name === "KI-Navigator")?.matchScore).toBeGreaterThanOrEqual(80);
    expect(result.recommendations.find((row) => row.service.name === "Data & AI")?.matchScore).toBeGreaterThanOrEqual(80);
  });

  it("ranks KI-Navigator first when the contact role is specific to that service", () => {
    const result = recommendServices({
      opportunity: opportunity({
        signals: [{ type: "AI_STRATEGY", title: "[DEMO] AI strategy workshop", signalStrength: 88 }],
        recommendedContact: { role: "HEAD_OF_INNOVATION" },
      }),
      services: seedServicesForAccount("demo"),
    });
    expect(result.primaryRecommendation?.service.name).toBe("KI-Navigator");
    expect(result.primaryRecommendation?.reasons).toContain("Ansprechpartner passt zur Zielrolle");
  });

  it("recommends Cloud Migration for a cloud demo opportunity from seed services", () => {
    const result = recommendServices({
      opportunity: opportunity({
        company: { industry: "machinery", companySize: "LARGE" },
        signals: [{ type: "CLOUD_MIGRATION", title: "[DEMO] Cloud migration scoping", signalStrength: 86 }],
        recommendedContact: { role: "CTO" },
      }),
      services: seedServicesForAccount("demo"),
    });
    expect(result.primaryRecommendation?.service.name).toBe("Cloud Migration");
    expect(result.primaryRecommendation?.matchScore).toBeGreaterThanOrEqual(80);
  });
});
