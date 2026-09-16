import { Prisma } from "@prisma/client";
import type { Company } from "@/types";

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function serializeCompany(
  company: {
    id: string;
    name: string;
    legalName: string | null;
    website: string | null;
    industry: string | null;
    subIndustry: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    employees: number | null;
    revenue: Prisma.Decimal | null;
    revenueCurrency: string | null;
    revenueYear: number | null;
    companySize: Company["companySize"];
    ownership: string | null;
    description: string | null;
    isSeed: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
): Company {
  return {
    ...company,
    revenue: company.revenue === null ? null : company.revenue.toString(),
  };
}
