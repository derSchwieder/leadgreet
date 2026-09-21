import { Prisma } from "@prisma/client";
import type { Company } from "@/types";

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

function serializeCoordinate(value: Prisma.Decimal | null): number | null {
  if (value === null) return null;
  const numeric = Number(value.toString());
  return Number.isFinite(numeric) ? numeric : null;
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
    latitude: Prisma.Decimal | null;
    longitude: Prisma.Decimal | null;
    geocodedAt: Date | null;
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
    latitude: serializeCoordinate(company.latitude),
    longitude: serializeCoordinate(company.longitude),
    geocodedAt: company.geocodedAt,
    revenue: company.revenue === null ? null : company.revenue.toString(),
  };
}
