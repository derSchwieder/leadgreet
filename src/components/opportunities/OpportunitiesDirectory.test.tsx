import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OpportunitiesDirectory } from "./OpportunitiesDirectory";

describe("OpportunitiesDirectory", () => {
  it("renders a search field for company or opportunity", () => {
    const html = renderToStaticMarkup(
      <OpportunitiesDirectory
        opportunities={[
          {
            id: "opp-1",
            title: "Siemens AG — KI-Agent",
            isSeed: false,
            whyNow: "Signal ist aktuell.",
            recommendedApproach: "Prüfen.",
            opportunityScore: 57,
            status: "NEW",
            company: { id: "siemens", name: "Siemens AG" },
            recommendedContact: null,
            signals: [],
          },
        ]}
      />,
    );
    expect(html).toContain("Unternehmen oder Opportunity suchen …");
    expect(html).toContain("Siemens AG — KI-Agent");
  });
});
