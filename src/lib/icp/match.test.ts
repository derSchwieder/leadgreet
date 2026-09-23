import { describe, expect, it } from "vitest";
import { matchesIcp } from "./match";
import { scoreCompanyGreet } from "@/lib/scoring/company-greet";
import { SCORING_WEIGHTS } from "@/lib/scoring";

const now = new Date("2026-09-22T12:00:00.000Z");

describe("matchesIcp", () => {
  it("matches every company when the ICP is empty", () => {
    expect(matchesIcp({}, {})).toBe(true);
    expect(matchesIcp({ industry: "Software", country: "DE" }, {})).toBe(true);
    expect(matchesIcp({ industry: null, country: null }, null)).toBe(true);
    expect(
      matchesIcp(
        { industry: "Software" },
        { industries: [], countries: [], employees: {}, revenue: {} },
      ),
    ).toBe(true);
  });

  it("matches a present industry against the ICP list", () => {
    expect(
      matchesIcp({ industry: "Industrial" }, { industries: ["Industrial"] }),
    ).toBe(true);
    expect(
      matchesIcp({ industry: "  industrial  " }, { industries: ["Industrie"] }),
    ).toBe(true);
  });

  it("rejects an industry that is not in the ICP list", () => {
    expect(
      matchesIcp({ industry: "Software" }, { industries: ["Industrial"] }),
    ).toBe(false);
  });

  it("rejects a set industry filter when the company industry is missing", () => {
    expect(matchesIcp({}, { industries: ["Industrial"] })).toBe(false);
    expect(matchesIcp({ industry: null }, { industries: ["Industrial"] })).toBe(false);
    expect(matchesIcp({ industry: "   " }, { industries: ["Industrial"] })).toBe(false);
  });

  it("does not invent an industry match from a longer label", () => {
    expect(
      matchesIcp({ industry: "Industrieautomation" }, { industries: ["Industrial"] }),
    ).toBe(false);
  });

  it("matches a present country against known spellings", () => {
    expect(matchesIcp({ country: "DE" }, { countries: ["DE"] })).toBe(true);
    expect(matchesIcp({ country: "Deutschland" }, { countries: ["DE"] })).toBe(true);
    expect(matchesIcp({ country: "de" }, { countries: ["Germany"] })).toBe(true);
  });

  it("rejects a country that is not in the ICP list", () => {
    expect(matchesIcp({ country: "CH" }, { countries: ["DE"] })).toBe(false);
  });

  it("rejects a set country filter when the company country is missing", () => {
    expect(matchesIcp({}, { countries: ["DE"] })).toBe(false);
    expect(matchesIcp({ country: null }, { countries: ["DE"] })).toBe(false);
    expect(matchesIcp({ country: "  " }, { countries: ["DE"] })).toBe(false);
  });

  it("treats values inside one dimension as alternatives", () => {
    expect(
      matchesIcp({ industry: "Software" }, { industries: ["Industrial", "Software"] }),
    ).toBe(true);
    expect(
      matchesIcp({ country: "AT" }, { countries: ["DE", "AT", "CH"] }),
    ).toBe(true);
  });

  it("requires every set dimension to match", () => {
    expect(
      matchesIcp(
        { industry: "Industrial", country: "DE", employees: 200 },
        {
          industries: ["Industrial"],
          countries: ["DE"],
          employees: { min: 100 },
        },
      ),
    ).toBe(true);
    expect(
      matchesIcp(
        { industry: "Industrial", country: "CH", employees: 200 },
        {
          industries: ["Industrial"],
          countries: ["DE"],
          employees: { min: 100 },
        },
      ),
    ).toBe(false);
  });

  it("matches an employees range when the company value is present", () => {
    expect(
      matchesIcp({ employees: 100 }, { employees: { min: 100, max: 5000 } }),
    ).toBe(true);
    expect(
      matchesIcp({ employees: 5000 }, { employees: { min: 100, max: 5000 } }),
    ).toBe(true);
    expect(
      matchesIcp({ employees: 99 }, { employees: { min: 100, max: 5000 } }),
    ).toBe(false);
  });

  it("rejects an employees filter when the company value is missing", () => {
    expect(matchesIcp({}, { employees: { min: 100 } })).toBe(false);
    expect(matchesIcp({ employees: null }, { employees: { min: 100, max: 5000 } })).toBe(false);
  });

  it("treats employees 0 as a present value, not as missing", () => {
    expect(matchesIcp({ employees: 0 }, { employees: { min: 0, max: 10 } })).toBe(true);
    expect(matchesIcp({ employees: 0 }, { employees: { min: 1 } })).toBe(false);
  });

  it("matches a revenue range when the stored amount can be read", () => {
    expect(
      matchesIcp({ revenue: 20_000_000 }, { revenue: { min: 20_000_000, max: 5_000_000_000 } }),
    ).toBe(true);
    expect(
      matchesIcp(
        { revenue: "20000000" },
        { revenue: { min: 20_000_000, max: 5_000_000_000 } },
      ),
    ).toBe(true);
    expect(
      matchesIcp({ revenue: 19_999_999 }, { revenue: { min: 20_000_000 } }),
    ).toBe(false);
  });

  it("rejects a revenue filter when the company amount is missing or unreadable", () => {
    expect(matchesIcp({}, { revenue: { min: 20_000_000 } })).toBe(false);
    expect(matchesIcp({ revenue: null }, { revenue: { min: 20_000_000 } })).toBe(false);
    expect(matchesIcp({ revenue: "  " }, { revenue: { max: 5_000_000_000 } })).toBe(false);
    expect(matchesIcp({ revenue: "20 Mio" }, { revenue: { min: 1 } })).toBe(false);
  });

  it("matches the combination of industry and country", () => {
    expect(
      matchesIcp(
        { industry: "Industrial", country: "DE" },
        { industries: ["Industrial"], countries: ["DE"] },
      ),
    ).toBe(true);
    expect(
      matchesIcp(
        { industry: "Industrial" },
        { industries: ["Industrial"], countries: ["DE"] },
      ),
    ).toBe(false);
    expect(
      matchesIcp(
        { country: "DE" },
        { industries: ["Industrial"], countries: ["DE"] },
      ),
    ).toBe(false);
  });
});

describe("ICP stays outside Greet", () => {
  it("does not change Company-Greet weights or the live formula", () => {
    expect(SCORING_WEIGHTS).toEqual({
      signalStrength: 25,
      freshness: 20,
      companyFit: 20,
      contactFit: 15,
      confidence: 20,
    });

    const greet = scoreCompanyGreet({
      now,
      company: {
        industry: "Software",
        subIndustry: null,
        country: "Deutschland",
        employees: null,
        companySize: null,
        website: "https://www.teamviewer.com",
        city: "Göppingen",
        revenue: null,
      },
      signals: [
        {
          type: "ERP_TRANSFORMATION",
          detectedAt: new Date("2026-09-02T12:00:00.000Z"),
          eventDate: new Date("2026-09-02T12:00:00.000Z"),
          sourceType: "NEWS",
          sourceCredibility: 85,
          sourceUrl: "https://news.sap.com/harting",
          title: "HARTING accelerates cloud transformation with RISE with SAP",
          description: "RISE with SAP.",
        },
      ],
      contact: null,
    });

    expect(greet.freshness).toBe(90);
    expect(greet.opportunityScore).toBeGreaterThan(0);
    expect(
      matchesIcp(
        { industry: "Software", country: "Deutschland", employees: null, revenue: null },
        { employees: { min: 100 } },
      ),
    ).toBe(false);
  });
});
