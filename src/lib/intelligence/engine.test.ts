import { describe, expect, it } from "vitest";
import {
  buildCompanyIntelligence,
  deriveNextStep,
  rankMatchingContacts,
  scoreContentMatch,
} from "./engine";
import type {
  CompanyIntelligenceInput,
  IntelligenceActivity,
  IntelligenceContact,
  IntelligenceContentItem,
  IntelligenceServiceInput,
  IntelligenceSignal,
} from "./types";

const detectedAt = new Date("2026-09-01T10:00:00.000Z");

function service(overrides: Partial<IntelligenceServiceInput> = {}): IntelligenceServiceInput {
  return {
    id: "svc-ki",
    accountId: "account-a",
    name: "KI-Navigator",
    targetIndustries: ["manufacturing"],
    targetCompanySizes: ["LARGE"],
    targetRoles: ["CIO", "CDO", "HEAD_OF_AI"],
    matchingSignalTypes: ["AI_PROJECT", "AI_STRATEGY", "GENAI"],
    businessCaseTypes: ["COST_REDUCTION", "CAPACITY", "REVENUE_GROWTH"],
    valuePropositions: ["KI-Reifegrad klären"],
    conversationStarter: "Wo steht das Unternehmen beim Thema KI?",
    isActive: true,
    ...overrides,
  };
}

function signal(overrides: Partial<IntelligenceSignal> = {}): IntelligenceSignal {
  return {
    id: "sig-1",
    type: "AI_PROJECT",
    title: "Neues KI-Projekt",
    signalStrength: 88,
    detectedAt,
    ...overrides,
  };
}

function content(overrides: Partial<IntelligenceContentItem> = {}): IntelligenceContentItem {
  return {
    id: "cnt-1",
    name: "KI-Navigator – One-Pager",
    type: "ONE_PAGER",
    url: null,
    isActive: true,
    businessCaseTypes: ["COST_REDUCTION", "CAPACITY"],
    targetRoles: ["CIO", "CDO"],
    targetCompanySizes: ["LARGE"],
    services: [{ id: "svc-ki", name: "KI-Navigator" }],
    ...overrides,
  };
}

function contact(overrides: Partial<IntelligenceContact> = {}): IntelligenceContact {
  return {
    id: "con-cio",
    fullName: "Seed CIO",
    role: "CIO",
    isDecisionMaker: true,
    email: null,
    ...overrides,
  };
}

function activity(overrides: Partial<IntelligenceActivity> = {}): IntelligenceActivity {
  return {
    id: "act-1",
    type: "NOTE",
    subject: "Interne Vorbereitung",
    occurredAt: new Date("2026-09-10T08:00:00.000Z"),
    outcome: null,
    accountId: "account-a",
    ...overrides,
  };
}

function input(overrides: Partial<CompanyIntelligenceInput> = {}): CompanyIntelligenceInput {
  return {
    accountId: "account-a",
    company: {
      id: "co-1",
      name: "Beispiel GmbH",
      industry: "manufacturing",
      companySize: "LARGE",
    },
    signals: [signal()],
    services: [service()],
    contentItems: [content()],
    contacts: [contact(), contact({ id: "con-other", fullName: "Seed Other", role: "OTHER", isDecisionMaker: false })],
    activities: [],
    ...overrides,
  };
}

describe("company intelligence engine", () => {
  it("connects a matching signal to the tenant service", () => {
    const result = buildCompanyIntelligence(input());
    expect(result.primaryService?.service.name).toBe("KI-Navigator");
    expect(result.triggerSignal?.title).toBe("Neues KI-Projekt");
    expect(result.businessCases.length).toBeGreaterThan(0);
  });

  it("does not recommend a service that does not match the signal", () => {
    const result = buildCompanyIntelligence(
      input({
        services: [
          service({
            id: "svc-cloud",
            name: "Cloud Migration",
            matchingSignalTypes: ["CLOUD_MIGRATION"],
            targetRoles: ["CIO"],
          }),
        ],
        contentItems: [],
      }),
    );
    expect(result.primaryService).toBeNull();
    expect(result.recommendedContent).toBeNull();
    expect(result.nextStep).toBe("PREPARE_OUTREACH");
  });

  it("recommends content linked to the matching service", () => {
    const unrelated = content({
      id: "cnt-other",
      name: "Unrelated Whitepaper",
      type: "WHITEPAPER",
      businessCaseTypes: [],
      targetRoles: [],
      services: [{ id: "svc-other", name: "Andere Leistung" }],
    });
    const result = buildCompanyIntelligence(input({ contentItems: [unrelated, content()] }));
    expect(result.recommendedContent?.item.name).toBe("KI-Navigator – One-Pager");
  });

  it("prefers contacts whose role matches the service target roles", () => {
    const ranked = rankMatchingContacts(
      [
        contact({ id: "coo", fullName: "Seed COO", role: "COO", isDecisionMaker: true }),
        contact({ id: "cio", fullName: "Seed CIO", role: "CIO", isDecisionMaker: false }),
      ],
      ["CIO", "CDO"],
    );
    expect(ranked.map((row) => row.id)).toEqual(["cio"]);

    const result = buildCompanyIntelligence(input());
    expect(result.matchingContact?.role).toBe("CIO");
  });

  it("keeps activities in the intelligence result", () => {
    const result = buildCompanyIntelligence(
      input({
        activities: [
          activity({ id: "older", occurredAt: new Date("2026-08-01T00:00:00.000Z") }),
          activity({
            id: "newer",
            type: "CALL",
            subject: "Kurz telefoniert",
            occurredAt: new Date("2026-09-12T00:00:00.000Z"),
            outcome: "INTERESTED",
          }),
        ],
      }),
    );
    expect(result.recentActivities.map((row) => row.id)).toEqual(["newer", "older"]);
  });

  it("only uses services provided for this account", () => {
    const result = buildCompanyIntelligence(
      input({
        services: [service()],
      }),
    );
    expect(result.primaryService?.service.accountId).toBe("account-a");
    expect(result.primaryService?.service.name).not.toBe("Cloud Infrastructure");
  });

  it("derives send-content when contact and content are present", () => {
    const next = deriveNextStep({
      hasMatchingService: true,
      hasMatchingContact: true,
      hasRecommendedContent: true,
      activities: [],
    });
    expect(next.nextStep).toBe("SEND_CONTENT");
  });

  it("derives follow-up from an unanswered outreach", () => {
    const next = deriveNextStep({
      hasMatchingService: true,
      hasMatchingContact: true,
      hasRecommendedContent: true,
      activities: [
        activity({
          type: "EMAIL_SENT",
          outcome: "NO_RESPONSE",
          occurredAt: new Date(),
        }),
      ],
    });
    expect(next.nextStep).toBe("CHECK_FOLLOW_UP");
  });

  it("does not score inactive or unrelated content", () => {
    expect(
      scoreContentMatch(content({ isActive: false }), {
        primaryServiceId: "svc-ki",
        recommendedServiceIds: ["svc-ki"],
        businessCaseTypes: ["COST_REDUCTION"],
        contactRoles: ["CIO"],
        companySize: "LARGE",
      }),
    ).toBeNull();

    expect(
      scoreContentMatch(
        content({
          services: [],
          businessCaseTypes: [],
          targetRoles: [],
        }),
        {
          primaryServiceId: "svc-ki",
          recommendedServiceIds: ["svc-ki"],
          businessCaseTypes: ["COST_REDUCTION"],
          contactRoles: ["CIO"],
          companySize: "LARGE",
        },
      ),
    ).toBeNull();
  });
});
