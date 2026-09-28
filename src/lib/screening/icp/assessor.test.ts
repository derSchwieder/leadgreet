import { describe, expect, it } from "vitest";
import { matchesIcp, type IcpProfile } from "@/lib/icp";
import { assessIcp, icpCompanyFromProfile } from "./assessor";
import type { CompanyScreeningCompanyProfile } from "@/types";

const profile: CompanyScreeningCompanyProfile = {
  companyName: "DATEV eG",
  industry: "Software",
  countries: ["DE"],
  employeeCount: 8000,
  revenue: "1200000000",
};

const icp: IcpProfile = {
  industries: ["Software"],
  countries: ["DE"],
  employees: { min: 100 },
  revenue: { min: 1_000_000 },
};

describe("assessIcp", () => {
  it("reuses matchesIcp for every existing ICP dimension", () => {
    const company = icpCompanyFromProfile(profile);
    const assessment = assessIcp(profile, icp);

    expect(assessment.industryFit).toBe(matchesIcp(company, { industries: icp.industries }));
    expect(assessment.geographyFit).toBe(matchesIcp(company, { countries: icp.countries }));
    expect(assessment.sizeFit).toBe(
      matchesIcp(company, { employees: icp.employees, revenue: icp.revenue }),
    );
    expect(assessment.overallFit).toBe(matchesIcp(company, icp));
    expect(assessment.strategicFit).toBeNull();
    expect(assessment.reasons).toEqual([
      "Branche entspricht dem ICP.",
      "Land entspricht dem ICP.",
      "Größe entspricht dem ICP.",
    ]);
    expect(assessment.mismatches).toEqual([]);
  });

  it("does not invent a second ICP score when dimensions miss", () => {
    const thin = { companyName: "Unknown", industry: null, countries: null, employeeCount: null };
    const company = icpCompanyFromProfile(thin);
    const assessment = assessIcp(thin, icp);

    expect(assessment.overallFit).toBe(matchesIcp(company, icp));
    expect(assessment.industryFit).toBe(false);
    expect(assessment.geographyFit).toBe(false);
    expect(assessment.sizeFit).toBe(false);
    expect(assessment.mismatches).toHaveLength(3);
  });
});
