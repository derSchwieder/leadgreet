import type { Company, CompanySize } from "@/types";
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

export async function countCompanies(): Promise<number> {
  return prisma.company.count();
}
