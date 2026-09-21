import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompaniesDirectory } from "./CompaniesDirectory";

const companies = [
  {
    id: "siemens",
    name: "Siemens AG",
    website: "https://www.siemens.com",
    industry: "Industrieautomation",
    city: "München",
    country: "Deutschland",
    employees: null,
    companySize: null,
    isSeed: false,
  },
  {
    id: "datev",
    name: "DATEV eG",
    website: null,
    industry: null,
    city: "Nürnberg",
    country: "Deutschland",
    employees: null,
    companySize: null,
    isSeed: false,
  },
];

describe("CompaniesDirectory", () => {
  it("renders the company search field above the list", () => {
    const html = renderToStaticMarkup(<CompaniesDirectory companies={companies} />);
    expect(html).toContain("Unternehmen suchen …");
    expect(html).toContain("Siemens AG");
    expect(html).toContain("DATEV eG");
    expect(html).toContain('href="/companies/siemens"');
  });
});
