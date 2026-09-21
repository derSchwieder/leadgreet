import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OpportunityTabs } from "./OpportunityTabs";

describe("OpportunityTabs", () => {
  it("renders four German tabs with Übersicht selected by default", () => {
    const html = renderToStaticMarkup(
      <OpportunityTabs
        overview={<p>Übersicht-Inhalt</p>}
        greetelligence={<p>Greetelligence-Inhalt</p>}
        activities={<p>Aktivitäten-Inhalt</p>}
        contacts={<p>Kontakte-Inhalt</p>}
      />,
    );

    expect(html).toContain("Übersicht");
    expect(html).toContain("Greetelligence");
    expect(html).toContain("Aktivitäten");
    expect(html).toContain("Kontakte");
    expect(html).toContain("Übersicht-Inhalt");
    expect(html).toContain("Greetelligence-Inhalt");
    expect(html).toContain('aria-selected="true"');
    expect(html).not.toContain("Chancenbewertung");
  });
});
