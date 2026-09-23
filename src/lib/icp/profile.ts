import { matchesRadarSensitivity } from "@/lib/radar/sensitivity";
import { EMPTY_ACCOUNT_ICP, toIcpProfile, type StoredAccountIcp } from "./account";
import { matchesIcp, type IcpCompanyInput } from "./match";

export const DEFAULT_RADAR_PROFILE_NAME = "Mein Radar";

export type RadarProfileFields = {
  name: string;
  industries: string[];
  countries: string[];
  minEmployees: number | null;
  minRevenue: number | null;
  greetThreshold: number;
  isActive: boolean;
};

export type RadarProfileView = RadarProfileFields & {
  id: string;
};

export function radarProfileFromAccountIcp(
  icp: StoredAccountIcp,
  name = DEFAULT_RADAR_PROFILE_NAME,
): Omit<RadarProfileFields, "name"> & { name: string } {
  return {
    name,
    industries: [...icp.industries],
    countries: [...icp.countries],
    minEmployees: icp.minEmployees,
    minRevenue: icp.minRevenue,
    greetThreshold: 0,
    isActive: true,
  };
}

export function storedIcpFromRadarProfile(
  profile: Pick<RadarProfileFields, "industries" | "countries" | "minEmployees" | "minRevenue">,
): StoredAccountIcp {
  return {
    industries: profile.industries,
    countries: profile.countries,
    minEmployees: profile.minEmployees,
    minRevenue: profile.minRevenue,
  };
}

export function icpProfileFromRadar(
  profile: Pick<RadarProfileFields, "industries" | "countries" | "minEmployees" | "minRevenue">,
) {
  return toIcpProfile(storedIcpFromRadarProfile(profile));
}

export function clampGreetThreshold(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function matchesRadarProfile(
  company: IcpCompanyInput,
  greet: number,
  profile: Pick<
    RadarProfileFields,
    "industries" | "countries" | "minEmployees" | "minRevenue" | "greetThreshold"
  >,
): boolean {
  if (!matchesIcp(company, icpProfileFromRadar(profile))) return false;
  return matchesRadarSensitivity(greet, clampGreetThreshold(profile.greetThreshold));
}

export function emptyRadarProfileFields(
  name = DEFAULT_RADAR_PROFILE_NAME,
): RadarProfileFields {
  return {
    ...radarProfileFromAccountIcp(EMPTY_ACCOUNT_ICP, name),
  };
}
