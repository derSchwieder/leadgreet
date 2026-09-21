import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OpportunityContacts } from "./OpportunityContacts";

describe("OpportunityContacts", () => {
  it("shows all company contacts with a recommended marker and work actions", () => {
    const html = renderToStaticMarkup(
      <OpportunityContacts
        companyId="co-1"
        canMutate
        recommendedContactId="c-cdo"
        contacts={[
          {
            id: "c-cdo",
            firstName: "Seed",
            lastName: "CDO",
            fullName: "Seed CDO",
            role: "CDO",
            isDecisionMaker: true,
            email: "cdo@example.com",
            phone: null,
            linkedinUrl: null,
            department: null,
            notes: "CIO bevorzugt kurze Erstansprache per E-Mail.",
            isSeed: true,
          },
          {
            id: "c-cio",
            firstName: "Herr",
            lastName: "Meier",
            fullName: "Herr Meier",
            role: "CIO",
            isDecisionMaker: true,
            email: null,
            phone: "+49 123",
            linkedinUrl: null,
            department: "IT",
            notes: null,
            isSeed: false,
          },
        ]}
      />,
    );

    expect(html).toContain("Kontakte");
    expect(html).toContain("+ Kontakt hinzufügen");
    expect(html).toContain("Empfohlener Kontakt");
    expect(html).toContain("Seed CDO");
    expect(html).toContain("CDO");
    expect(html).toContain("Entscheider");
    expect(html).toContain("cdo@example.com");
    expect(html).toContain("CIO bevorzugt kurze Erstansprache per E-Mail.");
    expect(html).toContain("Herr Meier");
    expect(html).toContain("CIO");
    expect(html).toContain("+49 123");
    expect(html).toContain("Bearbeiten");
    expect(html).toContain("Entfernen");
  });
});
