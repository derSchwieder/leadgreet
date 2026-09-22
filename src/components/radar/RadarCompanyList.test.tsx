import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RadarCompanyList } from "./RadarCompanyList";

describe("RadarCompanyList", () => {
  it("shows Company-Greet, not a Chance score", () => {
    const html = renderToStaticMarkup(
      <RadarCompanyList
        points={[
          {
            companyId: "harting",
            name: "HARTING Technology Group",
            city: "Espelkamp",
            country: "Deutschland",
            latitude: 52.3775,
            longitude: 8.6231,
            greet: 70,
            signalTitle: "RISE with SAP",
            website: null,
          },
        ]}
        selectedCompanyId={null}
        onSelect={() => undefined}
      />,
    );
    expect(html).toContain("HARTING Technology Group");
    expect(html).toContain("Greet");
    expect(html).toContain("70");
    expect(html).not.toContain("Chance");
  });
});
