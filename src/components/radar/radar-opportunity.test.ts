import { describe, expect, it, vi } from "vitest";
import { opportunityDetailPath } from "@/lib/opportunities/path";
import {
  radarOpportunityCtaLabel,
  radarOpportunityPath,
  resolveRadarOpportunity,
} from "./radar-opportunity";

describe("radar opportunity helpers", () => {
  it("builds the opportunity detail path", () => {
    expect(radarOpportunityPath("opp-42")).toBe("/opportunities/opp-42");
    expect(radarOpportunityPath("opp-42")).toBe(opportunityDetailPath("opp-42"));
  });

  it("labels the preview CTA from the lookup result", () => {
    expect(radarOpportunityCtaLabel("opp-1")).toBe("Opportunity öffnen");
    expect(radarOpportunityCtaLabel(null)).toBe("Opportunity anlegen");
  });

  it("navigates to the resolved opportunity after find-or-create", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ opportunityId: "opp-resolved", created: true }),
    });

    const resolved = await resolveRadarOpportunity("co-1", fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith("/api/radar/companies/co-1/opportunity", {
      method: "POST",
    });
    expect(radarOpportunityPath(resolved.opportunityId)).toBe("/opportunities/opp-resolved");
  });
});
