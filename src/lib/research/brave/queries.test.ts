import { describe, expect, it } from "vitest";
import { MAX_SCREENING_QUERIES, buildCompanyResearchQueries } from "./queries";

describe("buildCompanyResearchQueries", () => {
  it("builds generic DATEV queries without hardcoding the company in the template", () => {
    const queries = buildCompanyResearchQueries({ name: "DATEV", domain: null });
    expect(queries).toHaveLength(MAX_SCREENING_QUERIES);
    expect(queries).toEqual([
      "DATEV Unternehmen Produkte Dienstleistungen",
      "DATEV KI Digitalisierung AI",
      "DATEV aktuelle News Strategie Investitionen",
      "DATEV KI Data IT Jobs Stellenangebote",
      "DATEV Cloud Digitalisierung Transformation",
    ]);
    expect(queries.every((query) => query.startsWith("DATEV"))).toBe(true);
    expect(queries.some((query) => query.startsWith("site:"))).toBe(false);
  });

  it("adds one official-domain query and keeps external queries", () => {
    const queries = buildCompanyResearchQueries({ name: "DATEV", domain: "datev.de" });
    expect(queries).toHaveLength(5);
    expect(queries[0]).toBe("site:datev.de DATEV Unternehmen Produkte Dienstleistungen");
    expect(queries.slice(1).every((query) => !query.startsWith("site:"))).toBe(true);
    expect(queries.some((query) => query.includes("KI Digitalisierung"))).toBe(true);
  });

  it("sanitizes person names before building queries", () => {
    const queries = buildCompanyResearchQueries({
      name: "DATEV Max Mustermann CIO",
      domain: null,
    });
    expect(queries.every((query) => !/Mustermann|Max /.test(query))).toBe(true);
    expect(queries[0]).toContain("DATEV CIO");
  });
});
