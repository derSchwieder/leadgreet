import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecommendationCard } from "./RecommendationCard";
import { partitionRecommendations } from "./partition";
import type { RecommendationResult, ServiceRecommendation } from "@/lib/recommendation";

function rec(
  name: string,
  matchScore: number,
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
    },
    matchScore,
    reasons: extras.reasons ?? [`${name} passt zum Leistungsangebot`],
    matchedSignals: extras.matchedSignals ?? [`Signal für ${name}`],
    conversationStarter: extras.conversationStarter ?? `Einstieg für ${name}`,
    businessCases: extras.businessCases ?? [],
    primaryBusinessCase: extras.primaryBusinessCase ?? null,
  };
}

function result(recommendations: ServiceRecommendation[]): RecommendationResult {
  return {
    primaryRecommendation: recommendations[0] ?? null,
    alternativeRecommendations: recommendations.slice(1),
    recommendations,
    businessCases: [],
    primaryBusinessCase: null,
  };
}

describe("partitionRecommendations", () => {
  it("keeps equal top scores together instead of picking a winner", () => {
    const partitioned = partitionRecommendations(
      result([rec("KI-Navigator", 91), rec("Data & AI", 91), rec("Cloud Migration", 80)]),
    );
    expect(partitioned.primaries.map((row) => row.name)).toEqual(["KI-Navigator", "Data & AI"]);
    expect(partitioned.alternatives.map((row) => `${row.name} ${row.matchScore}`)).toEqual([
      "Cloud Migration 80",
    ]);
  });

  it("returns an empty partition when nothing matches", () => {
    expect(partitionRecommendations(result([]))).toEqual({ primaries: [], alternatives: [] });
  });
});

describe("RecommendationCard", () => {
  it("renders a recommendation with reasons, signals and conversation starter", () => {
    const html = renderToStaticMarkup(
      <RecommendationCard
        primaries={[
          {
            name: "KI-Navigator",
            matchScore: 80,
            reasons: ["KI-Strategie passt zum Leistungsangebot", "Ansprechpartner passt zur Zielrolle"],
            matchedSignals: ["[DEMO] AI strategy workshop"],
            conversationStarter: "Wo steht das Unternehmen aktuell beim Thema KI?",
          },
        ]}
        alternatives={[
          {
            name: "Data & AI",
            matchScore: 60,
            reasons: [],
            matchedSignals: [],
            conversationStarter: null,
          },
        ]}
      />,
    );
    expect(html).toContain("Empfehlung");
    expect(html).toContain("KI-Navigator");
    expect(html).toContain("80 %");
    expect(html).toContain("Service-Fit");
    expect(html).toContain("KI-Strategie passt zum Leistungsangebot");
    expect(html).toContain("Ansprechpartner passt zur Zielrolle");
    expect(html).toContain("Passende Signale");
    expect(html).toContain("[DEMO] AI strategy workshop");
    expect(html).toContain("Gesprächseinstieg");
    expect(html).toContain("Wo steht das Unternehmen aktuell beim Thema KI?");
    expect(html).toContain("Weitere passende Angebote");
    expect(html).toContain("Data &amp; AI");
    expect(html).toContain("60 %");
    expect(html).not.toContain("Chancenbewertung");
  });

  it("shows the empty state when no recommendation exists", () => {
    const html = renderToStaticMarkup(<RecommendationCard primaries={[]} alternatives={[]} />);
    expect(html).toContain(
      "Für diese Opportunity wurde aktuell kein passendes Angebot aus deinem Portfolio gefunden.",
    );
    expect(html).not.toContain("Gesprächseinstieg");
    expect(html).not.toContain("Weitere passende Angebote");
  });

  it("renders tied top recommendations without choosing one", () => {
    const partitioned = partitionRecommendations(
      result([rec("KI-Navigator", 91), rec("Data & AI", 91)]),
    );
    const html = renderToStaticMarkup(
      <RecommendationCard primaries={partitioned.primaries} alternatives={partitioned.alternatives} />,
    );
    expect(html).toContain("Top-Empfehlungen");
    expect(html).toContain("KI-Navigator");
    expect(html).toContain("Data &amp; AI");
    expect(html).toContain("91 %");
    expect(html).not.toContain("Weitere passende Angebote");
  });

  it("omits matched signals when the list is empty", () => {
    const html = renderToStaticMarkup(
      <RecommendationCard
        primaries={[
          {
            name: "Cloud Migration",
            matchScore: 80,
            reasons: ["Cloud-Migrationssignal passt zum Service"],
            matchedSignals: [],
            conversationStarter: "Welche Workloads stehen an?",
          },
        ]}
        alternatives={[]}
      />,
    );
    expect(html).not.toContain("Passende Signale");
    expect(html).toContain("Gesprächseinstieg");
  });

  it("links Gespräch vorbereiten to the recommended contact when provided", () => {
    const html = renderToStaticMarkup(
      <RecommendationCard
        primaries={[
          {
            name: "Cloud Migration",
            matchScore: 80,
            reasons: [],
            matchedSignals: [],
            conversationStarter: null,
          },
        ]}
        alternatives={[]}
        contactHref="#empfohlener-kontakt"
      />,
    );
    expect(html).toContain("Gespräch vorbereiten");
    expect(html).toContain("#empfohlener-kontakt");
  });
});
