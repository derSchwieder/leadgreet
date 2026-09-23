import type { Prisma } from "@prisma/client";
import {
  clampGreetThreshold,
  DEFAULT_RADAR_PROFILE_NAME,
  radarProfileFromAccountIcp,
  type RadarProfileFields,
  type RadarProfileView,
  type StoredAccountIcp,
} from "@/lib/icp";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export function isMissingRadarProfileTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "P2021" && /RadarProfile/i.test(candidate.message ?? "")) return true;
  return (
    typeof candidate.message === "string" &&
    /RadarProfile/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

export async function listRadarProfiles(accountId: string): Promise<RadarProfileView[]> {
  try {
    const rows = await prisma.radarProfile.findMany({
      where: { accountId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map(toRadarProfileView);
  } catch (error) {
    if (isMissingRadarProfileTable(error)) return [];
    throw error;
  }
}

export async function getRadarProfile(
  accountId: string,
  profileId: string,
): Promise<RadarProfileView> {
  const row = await prisma.radarProfile.findFirst({
    where: { id: profileId, accountId },
  });
  if (!row) {
    throw new NotFoundError("RadarProfile", profileId);
  }
  return toRadarProfileView(row);
}

export async function createRadarProfile(
  accountId: string,
  input: RadarProfileFields,
): Promise<RadarProfileView> {
  const row = await prisma.radarProfile.create({
    data: {
      accountId,
      ...toPrismaData(input),
    },
  });
  return toRadarProfileView(row);
}

export async function updateRadarProfile(
  accountId: string,
  profileId: string,
  input: Partial<RadarProfileFields>,
): Promise<RadarProfileView> {
  await getRadarProfile(accountId, profileId);
  const row = await prisma.radarProfile.update({
    where: { id: profileId },
    data: toPrismaPatch(input),
  });
  return toRadarProfileView(row);
}

export async function deleteRadarProfile(accountId: string, profileId: string): Promise<void> {
  await getRadarProfile(accountId, profileId);
  await prisma.radarProfile.delete({ where: { id: profileId } });
}

export async function upsertDefaultRadarProfile(
  accountId: string,
  icp: StoredAccountIcp,
): Promise<RadarProfileView | null> {
  try {
    const existing = await prisma.radarProfile.findFirst({
      where: { accountId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const fields = radarProfileFromAccountIcp(icp);
    if (existing) {
      const row = await prisma.radarProfile.update({
        where: { id: existing.id },
        data: {
          industries: fields.industries,
          countries: fields.countries,
          minEmployees: fields.minEmployees,
          minRevenue: fields.minRevenue,
        },
      });
      return toRadarProfileView(row);
    }
    return createRadarProfile(accountId, fields);
  } catch (error) {
    if (isMissingRadarProfileTable(error)) return null;
    throw error;
  }
}

function toRadarProfileView(row: {
  id: string;
  name: string;
  industries: string[];
  countries: string[];
  minEmployees: number | null;
  minRevenue: { toString(): string } | number | null;
  greetThreshold: number;
  isActive: boolean;
}): RadarProfileView {
  return {
    id: row.id,
    name: row.name,
    industries: row.industries,
    countries: row.countries,
    minEmployees: row.minEmployees,
    minRevenue: toOptionalNumber(row.minRevenue),
    greetThreshold: clampGreetThreshold(row.greetThreshold),
    isActive: row.isActive,
  };
}

function toPrismaData(input: RadarProfileFields) {
  return {
    name: input.name.trim() || DEFAULT_RADAR_PROFILE_NAME,
    industries: input.industries,
    countries: input.countries,
    minEmployees: input.minEmployees,
    minRevenue: input.minRevenue,
    greetThreshold: clampGreetThreshold(input.greetThreshold),
    isActive: input.isActive,
  };
}

function toPrismaPatch(input: Partial<RadarProfileFields>) {
  const data: Prisma.RadarProfileUncheckedUpdateInput = {};
  if (input.name != null) data.name = input.name.trim() || DEFAULT_RADAR_PROFILE_NAME;
  if (input.industries !== undefined) data.industries = input.industries;
  if (input.countries !== undefined) data.countries = input.countries;
  if (input.minEmployees !== undefined) data.minEmployees = input.minEmployees;
  if (input.minRevenue !== undefined) data.minRevenue = input.minRevenue;
  if (input.greetThreshold != null) data.greetThreshold = clampGreetThreshold(input.greetThreshold);
  if (input.isActive != null) data.isActive = input.isActive;
  return data;
}

function toOptionalNumber(value: { toString(): string } | number | null): number | null {
  if (value == null) return null;
  const numeric = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(numeric) ? numeric : null;
}
