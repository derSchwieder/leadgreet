import type { Company, CompanySize } from "@/types";
import { CLEARED_GEO_CACHE, shouldClearGeoCache } from "@/lib/geocoding";
import { prisma } from "./client";
import { NotFoundError, serializeCompany } from "./serialize";

export interface CreateCompanyInput {
  name: string;
  legalName?: string | null;
  website?: string | null;
  industry?: string | null;
  subIndustry?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  employees?: number | null;
  revenue?: string | null;
  revenueCurrency?: string | null;
  revenueYear?: number | null;
  companySize?: CompanySize | null;
  ownership?: string | null;
  description?: string | null;
  isSeed?: boolean;
}

export type UpdateCompanyInput = {
  name?: string;
  legalName?: string | null;
  website?: string | null;
  industry?: string | null;
  subIndustry?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  employees?: number | null;
  revenue?: string | null;
  revenueCurrency?: string | null;
  revenueYear?: number | null;
  companySize?: CompanySize | null;
  ownership?: string | null;
  description?: string | null;
};

export async function listCompanies(): Promise<Company[]> {
  const rows = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map(serializeCompany);
}

export async function getCompanyById(id: string): Promise<Company> {
  const row = await prisma.company.findUnique({ where: { id } });
  if (!row) {
    throw new NotFoundError("Company", id);
  }
  return serializeCompany(row);
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const row = await prisma.company.create({
    data: {
      name: input.name,
      legalName: input.legalName ?? null,
      website: input.website ?? null,
      industry: input.industry ?? null,
      subIndustry: input.subIndustry ?? null,
      city: input.city ?? null,
      region: input.region ?? null,
      country: input.country ?? null,
      employees: input.employees ?? null,
      revenue: input.revenue ?? null,
      revenueCurrency: input.revenueCurrency ?? null,
      revenueYear: input.revenueYear ?? null,
      companySize: input.companySize ?? null,
      ownership: input.ownership ?? null,
      description: input.description ?? null,
      isSeed: input.isSeed ?? false,
    },
  });
  return serializeCompany(row);
}

/**
 * Application-level company update. All city/country changes must go through
 * this function so the geo cache cannot stay attached to a previous place.
 * Does not geocode. Coordinates are only written by geocodeAndCacheCompany.
 */
export async function updateCompany(
  id: string,
  input: UpdateCompanyInput,
): Promise<Company> {
  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Company", id);
  }

  const clearGeo = shouldClearGeoCache(
    { city: existing.city, country: existing.country },
    { city: input.city, country: input.country },
  );

  const row = await prisma.company.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.industry !== undefined ? { industry: input.industry } : {}),
      ...(input.subIndustry !== undefined ? { subIndustry: input.subIndustry } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.employees !== undefined ? { employees: input.employees } : {}),
      ...(input.revenue !== undefined ? { revenue: input.revenue } : {}),
      ...(input.revenueCurrency !== undefined ? { revenueCurrency: input.revenueCurrency } : {}),
      ...(input.revenueYear !== undefined ? { revenueYear: input.revenueYear } : {}),
      ...(input.companySize !== undefined ? { companySize: input.companySize } : {}),
      ...(input.ownership !== undefined ? { ownership: input.ownership } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(clearGeo ? CLEARED_GEO_CACHE : {}),
    },
  });
  return serializeCompany(row);
}

export async function countCompanies(): Promise<number> {
  return prisma.company.count();
}

export type CompanyIcpRecord = {
  id: string;
  industry: string | null;
  country: string | null;
  employees: number | null;
  revenue: string | null;
};

export async function listCompanyIcpRecords(
  excludedCompanyIds?: ReadonlySet<string>,
): Promise<CompanyIcpRecord[]> {
  const rows = await prisma.company.findMany({
    select: { id: true, industry: true, country: true, employees: true, revenue: true },
    orderBy: { name: "asc" },
  });
  return rows
    .filter((row) => !excludedCompanyIds?.has(row.id))
    .map((row) => ({
      id: row.id,
      industry: row.industry,
      country: row.country,
      employees: row.employees,
      revenue: row.revenue == null ? null : row.revenue.toString(),
    }));
}
