import { describe, expect, it } from "vitest";
import { scoreFreshness } from "./freshness";
import { scoreOpportunity } from "./opportunity";
import { SCORING_DIMENSIONS, SCORING_WEIGHTS } from "./weights";
import type { ScoreOpportunityInput } from "./types";

const now = new Date("2026-09-16T12:00:00.000Z");

function baseInput(overrides: Partial<ScoreOpportunityInput> = {}): ScoreOpportunityInput {
  return {
    now,
    company: {
      industry: "automotive",
      subIndustry: null,
      country: "Germany",
      employees: 4000,
      companySize: "LARGE",
      website: "https://example.com",
      city: "Munich",
      revenue: "1000000000",
    },
    signals: [
      {
        type: "AI_AGENT",
        detectedAt: new Date("2026-09-10T00:00:00.000Z"),
        eventDate: new Date("2026-09-08T00:00:00.000Z"),
        sourceType: "PRESS_RELEASE",
        sourceCredibility: 90,
        sourceUrl: "https://example.com/press",
        title: "AI agent program",
        description: "Public announcement",
      },
    ],
    contact: {
      role: "CIO",
      isDecisionMaker: true,
      confidenceScore: 80,
      email: "cio@example.com",
      linkedinUrl: null,
      department: "IT",
    },
    ...overrides,
  };
}

describe("scoring weights", () => {
  it("sum to 100 so the total score stays explainable", () => {
    const total = SCORING_DIMENSIONS.reduce((sum, key) => sum + SCORING_WEIGHTS[key], 0);
    expect(total).toBe(100);
  });
});

describe("freshness", () => {
  it("scores a 7-day-old signal at 100", () => {
    const result = scoreFreshness(
      [
        {
          type: "AI_PROJECT",
          detectedAt: new Date("2026-09-10T00:00:00.000Z"),
          eventDate: new Date("2026-09-10T00:00:00.000Z"),
          sourceType: "NEWS",
          sourceCredibility: 70,
          sourceUrl: null,
          title: "Test",
          description: null,
        },
      ],
      now,
    );
    expect(result.score).toBe(100);
  });

  it("decays after 180 days", () => {
    const result = scoreFreshness(
      [
        {
          type: "AI_PROJECT",
          detectedAt: new Date("2025-01-01T00:00:00.000Z"),
          eventDate: new Date("2025-01-01T00:00:00.000Z"),
          sourceType: "NEWS",
          sourceCredibility: 70,
          sourceUrl: null,
          title: "Test",
          description: null,
        },
      ],
      now,
    );
    expect(result.score).toBe(10);
  });
});

describe("scoreOpportunity", () => {
  it("returns a 0–100 total equal to the rounded weighted sum", () => {
    const result = scoreOpportunity(baseInput());
    const weighted =
      (result.signalStrength / 100) * SCORING_WEIGHTS.signalStrength +
      (result.freshness / 100) * SCORING_WEIGHTS.freshness +
      (result.companyFit / 100) * SCORING_WEIGHTS.companyFit +
      (result.contactFit / 100) * SCORING_WEIGHTS.contactFit +
      (result.confidence / 100) * SCORING_WEIGHTS.confidence;

    expect(result.opportunityScore).toBeGreaterThan(0);
    expect(result.opportunityScore).toBeLessThanOrEqual(100);
    expect(result.opportunityScore).toBe(Math.round(weighted));
  });

  it("produces a human-readable explanation with contributions", () => {
    const result = scoreOpportunity(baseInput());
    expect(result.explanation).toContain("Opportunity Score:");
    expect(result.explanation).toContain("Signal Strength:");
    expect(result.explanation).toContain("Weighted contributions");
    expect(result.whyNow.length).toBeGreaterThan(10);
  });

  it("lowers company fit and confidence when the profile is name-only", () => {
    const rich = scoreOpportunity(baseInput());
    const sparse = scoreOpportunity(
      baseInput({
        company: {
          industry: null,
          subIndustry: null,
          country: null,
          employees: null,
          companySize: null,
          website: null,
          city: null,
          revenue: null,
        },
      }),
    );

    expect(sparse.companyFit).toBeLessThan(rich.companyFit);
    expect(sparse.confidence).toBeLessThan(rich.confidence);
  });

  it("scores lower without a contact", () => {
    const withContact = scoreOpportunity(baseInput());
    const without = scoreOpportunity(baseInput({ contact: null }));
    expect(without.contactFit).toBeLessThan(withContact.contactFit);
  });
});
