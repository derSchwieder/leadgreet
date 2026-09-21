import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OpportunityListCard } from "./OpportunityListCard";
import { opportunityDetailPath } from "@/lib/opportunities/path";
import { radarOpportunityPath } from "@/components/radar/radar-opportunity";

const opportunity = {
  id: "opp-schaeffler",
  title: "Schaeffler — DATA PLATFORM",
  isSeed: true,
  whyNow: "Das Signal ist aktuell.",
  recommendedApproach: "Prüfen Sie das aktuelle Signal.",
  opportunityScore: 82,
  status: "NEW",
  company: { id: "co-schaeffler", name: "Schaeffler" },
  recommendedContact: { fullName: "Seed CDO", role: "CDO" },
  signals: [{ type: "DATA_PLATFORM", detectedAt: "2026-09-14T00:00:00.000Z" }],
};

describe("OpportunityListCard", () => {
  const html = renderToStaticMarkup(<OpportunityListCard opportunity={opportunity} />);

  it("opens the existing opportunity detail route from the Chancen list", () => {
    expect(html).toContain(`href="${opportunityDetailPath("opp-schaeffler")}"`);
    expect(html).toContain("Schaeffler — Datenplattform");
    expect(html).not.toContain("accountId");
    expect(html).not.toContain("/companies/co-schaeffler");
  });

  it("uses the same detail path as Radar Opportunity öffnen", () => {
    expect(opportunityDetailPath(opportunity.id)).toBe(radarOpportunityPath(opportunity.id));
    expect(html).toContain(`href="${radarOpportunityPath(opportunity.id)}"`);
  });
});
