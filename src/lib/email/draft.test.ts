import { describe, expect, it } from "vitest";
import { composeEmailDraft, outreachStance } from "./draft";
import { SUBJECT_BY_BUSINESS_CASE } from "./templates";
import type { EmailDraftInput } from "./types";

const FINANCIAL_CLAIM_PATTERN =
  /(\d[\d.\s]*\s*%|\d[\d.\s]*\s*€|\bEUR\b|\bEuro\b|500\.000|sparen Sie|Umsatzsteigerung um)/i;

function input(overrides: Partial<EmailDraftInput> = {}): EmailDraftInput {
  return {
    companyName: "Schaeffler",
    recommendedContact: {
      firstName: "Anna",
      lastName: "Müller",
      fullName: "Anna Müller",
      email: "anna.mueller@example.com",
      role: "CDO",
    },
    primaryServiceRecommendation: {
      name: "Data & AI",
      valuePropositions: [
        "Bestehende Daten besser nutzbar machen",
        "Prozesse datengetrieben automatisieren",
      ],
      conversationStarter:
        "Wenn gerade eine Datenplattform oder Analytics-Initiative läuft, lohnt sich ein Abgleich, wo operative Prozesse schon KI-fähig gemacht werden können.",
    },
    primaryBusinessCase: {
      type: "COST_REDUCTION",
      reasons: [
        "Möglicher Business Case: Kosten senken",
        "Das Signal kann auf Potenzial zur Reduzierung manueller Aufwände hindeuten.",
      ],
      supportingSignals: ["[DEMO] Process automation assessment"],
      valuePropositions: ["Prozesse datengetrieben automatisieren"],
    },
    supportingSignals: [
      { type: "PROCESS_AUTOMATION", title: "[DEMO] Process automation assessment" },
    ],
    conversationStarter:
      "Wenn gerade eine Datenplattform oder Analytics-Initiative läuft, lohnt sich ein Abgleich, wo operative Prozesse schon KI-fähig gemacht werden können.",
    activities: [],
    ...overrides,
  };
}

describe("composeEmailDraft", () => {
  it("uses a COST_REDUCTION subject centered on the customer benefit", () => {
    const draft = composeEmailDraft(input());
    expect(draft.subject).toBe(
      SUBJECT_BY_BUSINESS_CASE.COST_REDUCTION.replace("{company}", "Schaeffler"),
    );
    expect(draft.subject).toContain("Schaeffler");
    expect(draft.subject).not.toContain("Data & AI");
    expect(draft.subject).not.toMatch(/Unser Angebot|Wo steht/);
  });

  it("uses a REVENUE_GROWTH subject centered on the customer benefit", () => {
    const draft = composeEmailDraft(
      input({
        companyName: "VIA optronics",
        primaryBusinessCase: {
          type: "REVENUE_GROWTH",
          reasons: ["Möglicher Business Case: Umsatz steigern"],
          supportingSignals: ["[DEMO] AI project exploration"],
          valuePropositions: ["Neue datenbasierte Geschäftsmodelle ermöglichen"],
        },
        supportingSignals: [{ type: "AI_PROJECT", title: "[DEMO] AI project exploration" }],
      }),
    );
    expect(draft.subject).toBe("Neue Wachstumspotenziale für VIA optronics");
  });

  it("uses a CAPACITY subject centered on the customer benefit", () => {
    const draft = composeEmailDraft(
      input({
        companyName: "EM Gerätebau",
        primaryBusinessCase: {
          type: "CAPACITY",
          reasons: [
            "Möglicher Business Case: Kapazität schaffen",
            "Aktuelle IT-Rekrutierung deutet auf zusätzlichen Ressourcenbedarf hin",
          ],
          supportingSignals: ["[DEMO] IT recruiting activity"],
          valuePropositions: ["Zusätzliche Entwicklungskapazität bereitstellen"],
        },
        primaryServiceRecommendation: {
          name: "Individual Software",
          valuePropositions: ["Zusätzliche Entwicklungskapazität bereitstellen"],
          conversationStarter: "Welche Systeme stehen als Nächstes an?",
        },
        supportingSignals: [{ type: "IT_RECRUITING", title: "[DEMO] IT recruiting activity" }],
      }),
    );
    expect(draft.subject).toBe("Zusätzliche Kapazität für EM Gerätebau");
  });

  it("uses a RISK_REDUCTION subject centered on the customer benefit", () => {
    const draft = composeEmailDraft(
      input({
        companyName: "Goldhofer",
        primaryBusinessCase: {
          type: "RISK_REDUCTION",
          reasons: [
            "Software-Modernisierung kann auf das Ziel hinweisen, technische Risiken zu reduzieren.",
          ],
          supportingSignals: ["[DEMO] Cloud migration scoping"],
          valuePropositions: ["Technische Risiken bestehender Altsysteme reduzieren"],
        },
        primaryServiceRecommendation: {
          name: "Cloud Migration",
          conversationStarter: "Welche Workloads stehen für die Cloud-Migration an?",
        },
        supportingSignals: [{ type: "CLOUD_MIGRATION", title: "[DEMO] Cloud migration scoping" }],
      }),
    );
    expect(draft.subject).toBe("Potenzial zur Modernisierung bei Goldhofer");
  });

  it("does not invent a business case when none is supported", () => {
    const draft = composeEmailDraft(
      input({
        companyName: "SAF-HOLLAND",
        primaryBusinessCase: null,
        primaryServiceRecommendation: null,
        conversationStarter: null,
        supportingSignals: [{ type: "NEW_CIO", title: "[DEMO] Leadership change — CIO role" }],
      }),
    );
    expect(draft.businessCaseType).toBeNull();
    expect(draft.basis.businessCase).toBeNull();
    expect(draft.subject).toBe("Ein aktuelles Signal bei SAF-HOLLAND");
    expect(draft.subject).not.toMatch(/Kapazität|Wachstumspotenziale|effizientere Prozesse|Modernisierung bei/);
    expect(draft.body).not.toContain("Kosten senken");
    expect(draft.body).not.toContain("Umsatz steigern");
  });

  it("mentions the observed signal without inventing extra facts", () => {
    const draft = composeEmailDraft(input());
    expect(draft.body).toContain("Prozessautomatisierung");
    expect(draft.evidenceSignals).toContain("[DEMO] Process automation assessment");
    expect(draft.basis.signal).toContain("Prozessautomatisierung");
    expect(draft.body).not.toContain("47 offene");
  });

  it("includes the value proposition", () => {
    const draft = composeEmailDraft(input());
    expect(draft.body).toContain("Prozesse datengetrieben automatisieren");
    expect(draft.valueProposition).toBe("Prozesse datengetrieben automatisieren");
  });

  it("includes the recommended service without product advertising", () => {
    const draft = composeEmailDraft(input());
    expect(draft.serviceName).toBe("Data & AI");
    expect(draft.body).toContain("Data & AI");
    expect(draft.body).not.toMatch(/innovative Lösung|Unser Angebot/);
  });

  it("uses the conversation starter as the next-step ask", () => {
    const draft = composeEmailDraft(input());
    expect(draft.body).toContain(
      "Wenn gerade eine Datenplattform oder Analytics-Initiative läuft, lohnt sich ein Abgleich, wo operative Prozesse schon KI-fähig gemacht werden können.",
    );
  });

  it("does not invent financial claims", () => {
    const draft = composeEmailDraft(input());
    const text = `${draft.subject}\n${draft.fullText}\n${draft.basis.businessCase}\n${draft.basis.valueProposition}`;
    expect(text).not.toMatch(FINANCIAL_CLAIM_PATTERN);
  });

  it("does not invent a person when no contact is present", () => {
    const draft = composeEmailDraft(input({ recommendedContact: null }));
    expect(draft.greeting).toBe("Hallo,");
    expect(draft.recipientName).toBeNull();
    expect(draft.recipientEmail).toBeNull();
    expect(draft.fullText).not.toContain("Frau");
    expect(draft.fullText).not.toContain("Herr");
    expect(draft.fullText).not.toContain("Müller");
  });

  it("treats EMAIL_SENT with NO_RESPONSE as a follow-up, not a first outreach", () => {
    const draft = composeEmailDraft(
      input({
        activities: [{ type: "EMAIL_SENT", outcome: "NO_RESPONSE" }],
      }),
    );
    expect(outreachStance([{ type: "EMAIL_SENT", outcome: "NO_RESPONSE" }])).toBe("follow_up");
    expect(draft.body).toContain("ich wollte mich zu meiner Nachricht noch einmal kurz melden");
    expect(draft.body).not.toMatch(/erstmals|zum ersten Mal|erstmalig/i);
  });

  it("does not write a first-contact mail after EMAIL_RECEIVED or RESPONSE_RECEIVED", () => {
    const received = composeEmailDraft(
      input({ activities: [{ type: "EMAIL_RECEIVED", outcome: "RESPONSE_RECEIVED" }] }),
    );
    expect(outreachStance([{ type: "EMAIL_RECEIVED", outcome: "RESPONSE_RECEIVED" }])).toBe(
      "continue",
    );
    expect(received.body).toContain("im Anschluss an unseren bisherigen Austausch");
    expect(received.body).not.toMatch(/erstmals|zum ersten Mal|erstmalig/i);
    expect(received.body).not.toContain("mir ist aufgefallen");
  });

  it("only uses the service provided for this account", () => {
    const draft = composeEmailDraft(
      input({
        primaryServiceRecommendation: {
          name: "KI-Navigator",
          valuePropositions: ["Bestehende Teams bei der KI-Umsetzung entlasten"],
          conversationStarter: "Wo steht das Unternehmen aktuell beim Thema KI?",
        },
      }),
    );
    expect(draft.serviceName).toBe("KI-Navigator");
    expect(draft.fullText).toContain("KI-Navigator");
    expect(draft.fullText).not.toContain("Cloud Infrastructure");
  });

  it("is deterministic for the same input", () => {
    const payload = input();
    expect(composeEmailDraft(payload)).toEqual(composeEmailDraft(payload));
  });
});
