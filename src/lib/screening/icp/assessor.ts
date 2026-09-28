import { matchesIcp, type IcpCompanyInput, type IcpProfile } from "@/lib/icp";
import type { CompanyScreeningCompanyProfile, CompanyScreeningIcpAssessment } from "@/types";

export function icpCompanyFromProfile(
  profile: CompanyScreeningCompanyProfile,
): IcpCompanyInput {
  return {
    industry: profile.industry,
    country: profile.countries?.[0] ?? null,
    employees: profile.employeeCount,
    revenue: profile.revenue ?? null,
  };
}

/**
 * Applies existing ICP V1 (`matchesIcp`) per dimension.
 * Does not introduce a second scoring formula.
 * strategicFit stays null: ICP V1 has no strategic dimension.
 */
export function assessIcp(
  profile: CompanyScreeningCompanyProfile,
  icp: IcpProfile,
): CompanyScreeningIcpAssessment {
  const company = icpCompanyFromProfile(profile);
  const industryFit = matchesIcp(company, { industries: icp.industries });
  const geographyFit = matchesIcp(company, { countries: icp.countries });
  const sizeFit = matchesIcp(company, { employees: icp.employees, revenue: icp.revenue });
  const overallFit = matchesIcp(company, icp);

  const reasons: string[] = [];
  const mismatches: string[] = [];
  pushFit(reasons, mismatches, industryFit, "Branche entspricht dem ICP.", "Branche passt nicht zum ICP oder fehlt.");
  pushFit(reasons, mismatches, geographyFit, "Land entspricht dem ICP.", "Land passt nicht zum ICP oder fehlt.");
  pushFit(reasons, mismatches, sizeFit, "Größe entspricht dem ICP.", "Größe passt nicht zum ICP oder fehlt.");

  return {
    overallFit,
    industryFit,
    sizeFit,
    geographyFit,
    strategicFit: null,
    reasons,
    mismatches,
  };
}

function pushFit(
  reasons: string[],
  mismatches: string[],
  fit: boolean,
  reason: string,
  mismatch: string,
) {
  if (fit) reasons.push(reason);
  else mismatches.push(mismatch);
}
