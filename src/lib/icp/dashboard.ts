import { countVisibleRadarPoints } from "@/lib/radar/sensitivity";
import { toIcpProfile, type StoredAccountIcp } from "./account";
import { matchesIcp, type IcpCompanyInput, type IcpProfile } from "./match";

export type IcpCompanyRecord = {
  id: string;
  industry: string | null;
  country: string | null;
  employees?: number | null;
  revenue?: string | number | null;
};

export type RadarIcpSummary<T> = {
  knownCompanies: number;
  icpMatching: number;
  onRadar: number;
  icpPoints: T[];
  icp: IcpProfile;
};

export function dashboardIcpFromSelection(icp: StoredAccountIcp): IcpProfile {
  return toIcpProfile(icp);
}

export function filterRadarPointsByIcp<T extends { companyId: string; country: string }>(
  points: readonly T[],
  companies: readonly IcpCompanyRecord[],
  icp: IcpProfile,
): T[] {
  const byId = new Map(companies.map((company) => [company.id, company]));
  return points.filter((point) =>
    matchesIcp(companyInputForPoint(point, byId.get(point.companyId)), icp),
  );
}

export function summarizeRadarIcp<T extends { companyId: string; country: string; greet: number }>(
  companies: readonly IcpCompanyRecord[],
  points: readonly T[],
  icp: IcpProfile,
  threshold: number,
): RadarIcpSummary<T> {
  const icpPoints = filterRadarPointsByIcp(points, companies, icp);
  return {
    knownCompanies: companies.length,
    icpMatching: companies.filter((company) => matchesIcp(company, icp)).length,
    onRadar: countVisibleRadarPoints(icpPoints, threshold),
    icpPoints,
    icp,
  };
}

function companyInputForPoint(
  point: { country: string },
  company: IcpCompanyRecord | undefined,
): IcpCompanyInput {
  return {
    industry: company?.industry ?? null,
    country: company?.country ?? point.country,
    employees: company?.employees ?? null,
    revenue: company?.revenue ?? null,
  };
}
