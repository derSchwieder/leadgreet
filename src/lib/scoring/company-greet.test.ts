import { describe, expect, it } from "vitest";
import { scoreCompanyGreet } from "./company-greet";
import { scoreOpportunity } from "./opportunity";
import type { ScoreOpportunityInput } from "./types";

const now = new Date("2026-09-22T12:00:00.000Z");

const teamViewerCompany: ScoreOpportunityInput["company"] = {
  industry: "Software",
  subIndustry: null,
  country: "Deutschland",
  employees: null,
  companySize: null,
  website: "https://www.teamviewer.com",
  city: "Göppingen",
  revenue: null,
};

const oldGenai: ScoreOpportunityInput["signals"][number] = {
  type: "GENAI",
  detectedAt: new Date("2025-07-02T12:00:00.000Z"),
  eventDate: new Date("2025-07-02T12:00:00.000Z"),
  sourceType: "PRESS_RELEASE",
  sourceCredibility: 85,
  sourceUrl: "https://www.teamviewer.com/intelligence",
  title: "TeamViewer bündelt KI-Funktionen unter TeamViewer Intelligence",
  description: "CoPilot und Session Insights.",
};

const oldModernization: ScoreOpportunityInput["signals"][number] = {
  type: "SOFTWARE_MODERNIZATION",
  detectedAt: new Date("2025-11-10T12:00:00.000Z"),
  eventDate: new Date("2025-11-10T12:00:00.000Z"),
  sourceType: "PRESS_RELEASE",
  sourceCredibility: 85,
  sourceUrl: "https://www.teamviewer.com/agentless",
  title: "TeamViewer ermöglicht agentlosen Remote-Zugriff auf Industrieanlagen",
  description: "Agentless Access.",
};

const tiaAgent: ScoreOpportunityInput["signals"][number] = {
  type: "AI_AGENT",
  detectedAt: new Date("2026-09-08T12:00:00.000Z"),
  eventDate: new Date("2026-09-08T12:00:00.000Z"),
  sourceType: "PRESS_RELEASE",
  sourceCredibility: 85,
  sourceUrl: "https://www.teamviewer.com/tia",
  title: "Automatisierung im IT-Support: TeamViewers KI-Agent Tia",
  description: "Tia Troubleshooting.",
};

const aiAdoption: ScoreOpportunityInput["signals"][number] = {
  type: "AI_STRATEGY",
  detectedAt: new Date("2026-09-15T12:00:00.000Z"),
  eventDate: new Date("2026-09-15T12:00:00.000Z"),
  sourceType: "PRESS_RELEASE",
  sourceCredibility: 85,
  sourceUrl: "https://www.teamviewer.com/ai-adoption",
  title: "TeamViewer AI adoption grows ninefold in twelve months",
  description: "AI usage grew 9.1-fold.",
};

describe("scoreCompanyGreet", () => {
  it("uses the existing opportunity formula without changing weights", () => {
    const input: ScoreOpportunityInput = {
      now,
      company: teamViewerCompany,
      signals: [tiaAgent],
      contact: null,
    };
    const companyGreet = scoreCompanyGreet(input);
    const opportunityScore = scoreOpportunity(input);
    expect(companyGreet).toEqual(opportunityScore);
    expect(companyGreet.freshness).toBe(opportunityScore.freshness);
    expect(companyGreet.opportunityScore).toBe(opportunityScore.opportunityScore);
  });

  it("A: computes a Company-Greet from current signals without an opportunity", () => {
    const result = scoreCompanyGreet({
      now,
      company: {
        industry: null,
        subIndustry: null,
        country: "Deutschland",
        employees: null,
        companySize: null,
        website: null,
        city: "Espelkamp",
        revenue: null,
      },
      signals: [
        {
          type: "ERP_TRANSFORMATION",
          detectedAt: new Date("2026-09-02T12:00:00.000Z"),
          eventDate: new Date("2026-09-02T12:00:00.000Z"),
          sourceType: "NEWS",
          sourceCredibility: 85,
          sourceUrl: "https://news.sap.com/harting",
          title: "HARTING accelerates cloud transformation with RISE with SAP",
          description: "RISE with SAP.",
        },
      ],
      contact: null,
    });

    expect(result.opportunityScore).toBeGreaterThan(0);
    expect(result.opportunityScore).toBeLessThanOrEqual(100);
    expect(result.freshness).toBe(90);
  });

  it("C: TeamViewer Company-Greet includes the September 2026 signals", () => {
    const withoutCurrent = scoreCompanyGreet({
      now,
      company: teamViewerCompany,
      signals: [oldGenai, oldModernization],
      contact: null,
    });
    const withCurrent = scoreCompanyGreet({
      now,
      company: teamViewerCompany,
      signals: [aiAdoption, tiaAgent, oldModernization, oldGenai],
      contact: null,
    });

    expect(withoutCurrent.freshness).toBe(10);
    expect(withCurrent.freshness).toBe(100);
    expect(withCurrent.opportunityScore).not.toBe(withoutCurrent.opportunityScore);
    expect(withCurrent.explanation).toContain("KI-Agent");
  });
});
