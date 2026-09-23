import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompanyRadarStateControls } from "./CompanyRadarStateControls";

describe("CompanyRadarStateControls", () => {
  it("offers exclude actions when no status is set", () => {
    const html = renderToStaticMarkup(
      <CompanyRadarStateControls companyId="co-1" initialStatus={null} />,
    );
    expect(html).toContain("Nicht relevant");
    expect(html).toContain("Abgelehnt");
    expect(html).not.toContain("Status zurücksetzen");
  });

  it("offers a reset when a status is set", () => {
    const html = renderToStaticMarkup(
      <CompanyRadarStateControls companyId="co-1" initialStatus="DECLINED" initialNote="kein Bedarf" />,
    );
    expect(html).toContain("Status zurücksetzen");
    expect(html).toContain("abgelehnt");
    expect(html).not.toContain("Nicht relevant");
  });
});
