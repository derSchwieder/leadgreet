import { describe, expect, it } from "vitest";
import { SCORING_WEIGHTS } from "@/lib/scoring";
import { filterRadarPointsBySearch } from "@/lib/search/entity-search";
import { EMPTY_ACCOUNT_ICP, toIcpProfile, type StoredAccountIcp } from "./account";
import {
  dashboardIcpFromSelection,
  filterRadarPointsByIcp,
  summarizeRadarIcp,
  type IcpCompanyRecord,
} from "./dashboard";

const companies: IcpCompanyRecord[] = [
  { id: "harting", industry: "Industrieautomation", country: "Deutschland", employees: 200, revenue: "80000000" },
  { id: "tv", industry: "Software", country: "Deutschland", employees: 1500, revenue: "600000000" },
  { id: "swiss", industry: "Software", country: "Schweiz", employees: 80, revenue: "20000000" },
  { id: "blank", industry: null, country: "Deutschland", employees: null, revenue: null },
];

const points = [
  {
    companyId: "harting",
    name: "HARTING Technology Group",
    city: "Espelkamp",
    country: "Deutschland",
    greet: 70,
  },
  {
    companyId: "tv",
    name: "TeamViewer SE",
    city: "Göppingen",
    country: "Deutschland",
    greet: 75,
  },
  {
    companyId: "swiss",
    name: "Swiss Soft",
    city: "Zürich",
    country: "Schweiz",
    greet: 40,
  },
];

function icp(overrides: Partial<StoredAccountIcp> = {}): StoredAccountIcp {
  return { ...EMPTY_ACCOUNT_ICP, ...overrides };
}

describe("dashboard ICP selection", () => {
  it("builds an empty ICP when nothing is selected", () => {
    expect(dashboardIcpFromSelection(EMPTY_ACCOUNT_ICP)).toEqual({
      industries: [],
      countries: [],
    });
    expect(dashboardIcpFromSelection(EMPTY_ACCOUNT_ICP).employees).toBeUndefined();
    expect(dashboardIcpFromSelection(EMPTY_ACCOUNT_ICP).revenue).toBeUndefined();
  });

  it("maps minima onto the match profile only when they are set", () => {
    expect(
      dashboardIcpFromSelection(icp({ industries: ["Software"], countries: ["Deutschland"] })),
    ).toEqual({
      industries: ["Software"],
      countries: ["Deutschland"],
    });
    expect(toIcpProfile(icp({ minEmployees: 100 })).employees).toEqual({ min: 100 });
    expect(toIcpProfile(icp({ minRevenue: 50_000_000 })).revenue).toEqual({ min: 50_000_000 });
  });
});

describe("radar ICP filtering and counts", () => {
  it("shows every known company as ICP-matching when the ICP is empty", () => {
    const summary = summarizeRadarIcp(companies, points, dashboardIcpFromSelection(EMPTY_ACCOUNT_ICP), 0);
    expect(summary.knownCompanies).toBe(4);
    expect(summary.icpMatching).toBe(4);
    expect(summary.onRadar).toBe(3);
    expect(summary.icpPoints.map((point) => point.companyId)).toEqual([
      "harting",
      "tv",
      "swiss",
    ]);
  });

  it("filters radar points by industry from company data", () => {
    const profile = dashboardIcpFromSelection(icp({ industries: ["Software"] }));
    const summary = summarizeRadarIcp(companies, points, profile, 0);
    expect(summary.icpMatching).toBe(2);
    expect(summary.icpPoints.map((point) => point.companyId)).toEqual(["tv", "swiss"]);
    expect(summary.onRadar).toBe(2);
  });

  it("rejects companies without an industry when an industry is selected", () => {
    const profile = dashboardIcpFromSelection(icp({ industries: ["Software"] }));
    expect(
      filterRadarPointsByIcp(
        [{ companyId: "blank", country: "Deutschland" }],
        companies,
        profile,
      ),
    ).toEqual([]);
  });

  it("filters radar points by country from company data", () => {
    const summary = summarizeRadarIcp(
      companies,
      points,
      dashboardIcpFromSelection(icp({ countries: ["Schweiz"] })),
      0,
    );
    expect(summary.icpMatching).toBe(1);
    expect(summary.icpPoints.map((point) => point.companyId)).toEqual(["swiss"]);
  });

  it("requires industry and country together", () => {
    const summary = summarizeRadarIcp(
      companies,
      points,
      dashboardIcpFromSelection(icp({ industries: ["Software"], countries: ["Deutschland"] })),
      0,
    );
    expect(summary.icpMatching).toBe(1);
    expect(summary.icpPoints.map((point) => point.companyId)).toEqual(["tv"]);
    expect(summary.onRadar).toBe(1);
  });

  it("filters by min employees and rejects missing employee data", () => {
    const profile = dashboardIcpFromSelection(icp({ minEmployees: 100 }));
    const summary = summarizeRadarIcp(companies, points, profile, 0);
    expect(summary.icpMatching).toBe(2);
    expect(summary.icpPoints.map((point) => point.companyId)).toEqual(["harting", "tv"]);
    expect(
      filterRadarPointsByIcp([{ companyId: "blank", country: "Deutschland" }], companies, profile),
    ).toEqual([]);
  });

  it("filters by min revenue and rejects missing revenue data", () => {
    const profile = dashboardIcpFromSelection(icp({ minRevenue: 50_000_000 }));
    const summary = summarizeRadarIcp(companies, points, profile, 0);
    expect(summary.icpMatching).toBe(2);
    expect(summary.icpPoints.map((point) => point.companyId)).toEqual(["harting", "tv"]);
  });

  it("keeps Greet as a separate threshold after ICP", () => {
    const summary = summarizeRadarIcp(
      companies,
      points,
      dashboardIcpFromSelection(icp({ industries: ["Software"] })),
      50,
    );
    expect(summary.icpMatching).toBe(2);
    expect(summary.onRadar).toBe(1);
    expect(summary.icpPoints.map((point) => point.companyId)).toEqual(["tv", "swiss"]);
    expect(summary.icpPoints.find((point) => point.companyId === "tv")?.greet).toBe(75);
  });

  it("does not change stored Company-Greet values while filtering", () => {
    const profile = dashboardIcpFromSelection(
      icp({ industries: ["Industrieautomation"], countries: ["Deutschland"] }),
    );
    const filtered = filterRadarPointsByIcp(points, companies, profile);
    expect(filtered).toEqual([points[0]]);
    expect(filtered[0]?.greet).toBe(70);
    expect(SCORING_WEIGHTS.companyFit).toBe(20);
  });

  it("still applies name search after ICP and Greet", () => {
    const { icpPoints } = summarizeRadarIcp(
      companies,
      points,
      dashboardIcpFromSelection(EMPTY_ACCOUNT_ICP),
      50,
    );
    const listed = filterRadarPointsBySearch(icpPoints, "TeamViewer", 50);
    expect(listed.map((point) => point.companyId)).toEqual(["tv"]);
    expect(filterRadarPointsBySearch(icpPoints, "Swiss", 50)).toEqual([]);
  });
});
