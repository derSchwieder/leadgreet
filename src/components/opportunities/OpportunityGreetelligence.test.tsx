import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OpportunityGreetelligence } from "./OpportunityGreetelligence";
import { toBusinessCasePresentation } from "@/components/recommendations/business-case-view";
import type { CompanyIntelligence } from "@/lib/intelligence";
import type {
  BusinessCaseHypothesis,
  RecommendationResult,
  ServiceRecommendation,
} from "@/lib/recommendation";

const capacity: BusinessCaseHypothesis = {
  type: "CAPACITY",
  confidence: 89,
  reasons: [
    "Möglicher Business Case: Kapazität schaffen",
    "Das Signal kann auf zusätzlichen Ressourcen- oder Kapazitätsbedarf hindeuten.",
  ],
  supportingSignals: ["[DEMO] Data platform initiative"],
  valuePropositions: ["KI-Anwendungen schneller in den Betrieb bringen"],
};

const service: ServiceRecommendation = {
  service: {
    name: "Data & AI",
    targetIndustries: [],
    targetCompanySizes: [],
    targetRoles: [],
    matchingSignalTypes: [],
    conversationStarter:
      "Bei einer aktuellen Datenplattform-Initiative lohnt sich ein Abgleich, welche operativen Prozesse bereits KI-fähig gemacht werden können.",
    isActive: true,
  },
  matchScore: 81,
  reasons: ["Datenplattform passt zum Leistungsangebot"],
  matchedSignals: ["[DEMO] Data platform initiative"],
  conversationStarter:
    "Bei einer aktuellen Datenplattform-Initiative lohnt sich ein Abgleich, welche operativen Prozesse bereits KI-fähig gemacht werden können.",
  businessCases: [capacity],
  primaryBusinessCase: capacity,
};

const recommendations: RecommendationResult = {
  primaryRecommendation: service,
  alternativeRecommendations: [],
  recommendations: [service],
  businessCases: [capacity],
  primaryBusinessCase: capacity,
};

const intelligence: CompanyIntelligence = {
  accountId: "acc-1",
  company: { id: "co-1", name: "Schaeffler", industry: null, companySize: null },
  triggerSignal: {
    id: "sig-1",
    type: "DATA_PLATFORM",
    title: "[DEMO] Data platform initiative",
    signalStrength: 84,
    detectedAt: new Date("2026-09-14T00:00:00.000Z"),
  },
  primaryService: null,
  businessCases: [],
  primaryBusinessCase: null,
  matchingContact: null,
  recommendedContent: {
    score: 70,
    item: {
      id: "ct-1",
      name: "Data One-Pager",
      type: "ONE_PAGER",
      url: null,
      isActive: true,
      businessCaseTypes: [],
      targetRoles: [],
      targetCompanySizes: [],
      services: [],
    },
  },
  recentActivities: [],
  nextStep: "SEND_CONTENT",
  nextStepReason: "Passenden Inhalt senden",
};

const longWhyNow =
  "Das auslösende Signal ist aktuell (unter 30 Tagen). Das Signal ist 3 Tage alt. Datenplattform hat eine Signalstärke von 84. Für diesen Account ist ein Ansprechpartner hinterlegt.";

describe("OpportunityGreetelligence", () => {
  const html = renderToStaticMarkup(
    <OpportunityGreetelligence
      chance={82}
      whyNow={longWhyNow}
      presentation={toBusinessCasePresentation(recommendations, [
        {
          title: "[DEMO] Data platform initiative",
          type: "DATA_PLATFORM",
          detectedAt: "2026-09-14T00:00:00.000Z",
        },
      ])}
      primaries={[
        {
          name: "Data & AI",
          matchScore: 81,
          reasons: ["Datenplattform passt zum Leistungsangebot"],
          matchedSignals: ["[DEMO] Data platform initiative"],
          conversationStarter: service.conversationStarter,
        },
      ]}
      alternatives={[]}
      recommendedApproach="Prüfen Sie das aktuelle Signal."
      intelligence={intelligence}
      signals={[
        {
          id: "sig-1",
          type: "DATA_PLATFORM",
          title: "[DEMO] Data platform initiative",
          detectedAt: "2026-09-14T00:00:00.000Z",
          signalStrength: 84,
          sourceName: "[DEMO] Press desk feed",
          sourceUrl: "https://example.com/press",
          sourceType: "PRESS_RELEASE",
        },
        {
          id: "sig-2",
          type: "PROCESS_AUTOMATION",
          title: "[DEMO] Process automation assessment",
          detectedAt: "2026-09-07T00:00:00.000Z",
          signalStrength: 71,
          sourceName: "[DEMO] Careers board",
          sourceUrl: null,
          sourceType: "JOB_POSTING",
        },
      ]}
      scores={{
        signalStrength: 100,
        freshness: 100,
        companyFit: 52,
        contactFit: 84,
        confidence: 71,
      }}
      explanation="Greet 82\nSignalstärke 100"
    />,
  );

  it("leads with a compact why-now and business-case explanation", () => {
    expect(html).toContain("Greetelligence");
    expect(html).toContain("Warum jetzt?");
    expect(html).toContain("Datenplattform");
    expect(html).toContain("[DEMO] Data platform initiative");
    expect(html).toContain("Signalstärke 84");
    expect(html).toContain("Pressemitteilung");
    expect(html).toContain("[DEMO] Press desk feed");
    expect(html).toContain("Quelle öffnen ↗");
    expect(html).toContain('href="https://example.com/press"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener noreferrer");
    expect(html).not.toContain("Quelle nicht hinterlegt");
    expect(html).not.toContain("Das Signal weist auf eine aktuelle Datenplattform hin.");
    expect(html).toContain("konkretes Vorhaben im Bereich Datenplattform");
    expect(html).toContain("Mögliche Business Cases");
    expect(html).toContain("Kapazität schaffen");
    expect(html).toContain("Warum?");
  });

  it("keeps service, signals and conversation starter compact", () => {
    expect(html).toContain("Passender Service");
    expect(html).toContain("Data &amp; AI");
    expect(html).toContain("81 %");
    expect(html).toContain("Der Service passt zum erkannten Vorhaben.");
    expect(html).toContain("Signale");
    expect(html).toContain("Prozessautomatisierung");
    expect(html).toContain("[DEMO] Process automation assessment");
    expect(html).toContain("Quelle: [DEMO] Press desk feed · ");
    expect(html).toContain("Quelle: [DEMO] Careers board");
    expect(html).toContain("Gesprächsanlass");
    expect(html).toContain("Datenplattform-Initiative");
    expect(html).not.toContain("Unterstützende Signale");
    expect(html).toContain("Weitere unterstützende Signale (1)");
    expect(html).not.toContain("Chancenbewertung");
  });

  it("keeps greet details, sources and content collapsed by default", () => {
    expect(html).toContain("Wie entsteht der Chance-Score?");
    expect(html).toContain("Greet 82");
    expect(html).toContain("Empfohlener Content");
    expect(html).toContain("Data One-Pager");
    expect(html).toContain("Quellen-Nachweis");
    expect(html).toContain(longWhyNow);
    expect(html).not.toContain("<details open");
  });

  it("does not invent a source when none is stored", () => {
    const missingSource = renderToStaticMarkup(
      <OpportunityGreetelligence
        chance={82}
        whyNow={null}
        presentation={toBusinessCasePresentation(recommendations)}
        primaries={[]}
        alternatives={[]}
        recommendedApproach={null}
        intelligence={intelligence}
        signals={[
          {
            id: "sig-1",
            type: "DATA_PLATFORM",
            title: "[DEMO] Data platform initiative",
            detectedAt: "2026-09-14T00:00:00.000Z",
            signalStrength: 84,
            sourceName: null,
            sourceUrl: null,
            sourceType: null,
          },
        ]}
        scores={{
          signalStrength: 100,
          freshness: 100,
          companyFit: 52,
          contactFit: 84,
          confidence: 71,
        }}
        explanation={null}
      />,
    );

    expect(missingSource).toContain("Quelle nicht hinterlegt");
    expect(missingSource).not.toContain("Quelle öffnen");
    expect(missingSource).not.toContain("Pressemitteilung");
    expect(missingSource).not.toContain("https://");
    expect(missingSource).not.toContain('href=""');
    expect(missingSource).not.toContain('href="#"');
  });

  it("renders a source link from the stored URL and opens it in a new tab", () => {
    const links = [...html.matchAll(/<a[^>]*href="https:\/\/example\.com\/press"[^>]*>/g)].map(
      (match) => match[0],
    );

    expect(links.length).toBeGreaterThan(0);
    expect(html).toContain(">Quelle öffnen ↗</a>");
    for (const link of links) {
      expect(link).toContain('href="https://example.com/press"');
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener noreferrer"');
    }
  });

  it("does not invent a clickable source link from an invalid URL", () => {
    const invalidSource = renderToStaticMarkup(
      <OpportunityGreetelligence
        chance={82}
        whyNow={null}
        presentation={toBusinessCasePresentation(recommendations)}
        primaries={[]}
        alternatives={[]}
        recommendedApproach={null}
        intelligence={intelligence}
        signals={[
          {
            id: "sig-1",
            type: "DATA_PLATFORM",
            title: "TeamViewer AI adoption grows ninefold in twelve months",
            detectedAt: "2026-09-15T00:00:00.000Z",
            signalStrength: 84,
            sourceName: "TeamViewer",
            sourceUrl: "not-a-url",
            sourceType: "PRESS_RELEASE",
          },
        ]}
        scores={{
          signalStrength: 100,
          freshness: 100,
          companyFit: 52,
          contactFit: 84,
          confidence: 71,
        }}
        explanation={null}
      />,
    );

    expect(invalidSource).toContain("Quelle: TeamViewer");
    expect(invalidSource).toContain("Quelle: Pressemitteilung · TeamViewer");
    expect(invalidSource).not.toContain("Quelle öffnen");
    expect(invalidSource).not.toContain('href="not-a-url"');
  });
});
