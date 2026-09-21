import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityForm } from "./ActivityForm";

describe("ActivityForm", () => {
  it("lists company contacts as name and role and keeps extras collapsed", () => {
    const html = renderToStaticMarkup(
      <ActivityForm
        open
        opportunityId="opp-1"
        companyId="co-1"
        contacts={[
          { id: "c-cdo", fullName: "Seed CDO", role: "CDO" },
          { id: "c-cio", fullName: "Herr Meier", role: "CIO" },
        ]}
        activities={[]}
        onClose={() => undefined}
        onCreated={() => undefined}
      />,
    );

    expect(html).toContain("Kein Kontakt");
    expect(html).toContain("Seed CDO · CDO");
    expect(html).toContain("Herr Meier · CIO");
    expect(html).toContain("Weitere Angaben");
    expect(html).toContain("Reaktion");
    expect(html).toContain("Bezieht sich auf");
  });
});
