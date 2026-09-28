import type { CompanyScreeningCompanyProfile, ScreeningSource } from "@/types";
import { namesMatch, websitesMatch, type NormalizedScreeningInput } from "../normalize";
import type { CompanyCatalogPort, CompanyResearchFinding, LocalCatalogCompany } from "./types";

export function matchLocalCompany(
  companies: readonly LocalCatalogCompany[],
  input: NormalizedScreeningInput,
): LocalCatalogCompany | null {
  if (input.domain) {
    const byDomain = companies.find((company) => websitesMatch(company.website, input.domain));
    if (byDomain) return byDomain;
  }
  return (
    companies.find(
      (company) => namesMatch(company.name, input.name) || namesMatch(company.legalName ?? "", input.name),
    ) ?? null
  );
}

export function profileFromLocalCompany(
  company: LocalCatalogCompany,
): CompanyScreeningCompanyProfile {
  return {
    companyName: company.legalName ?? company.name,
    domain: company.website,
    description: company.description,
    industry: company.industry,
    headquarters: [company.city, company.country].filter(Boolean).join(", ") || null,
    countries: company.country ? [company.country] : null,
    employeeCount: company.employees,
    revenue: company.revenue,
    ownership: company.ownership,
    companyType: null,
    businessModel: null,
    products: null,
  };
}

export function localCatalogSource(company: LocalCatalogCompany): ScreeningSource {
  return {
    title: company.name,
    url: company.website,
    publisher: "Leadgreet Katalog",
    publishedAt: null,
  };
}

export async function researchLocalCompany(
  catalog: CompanyCatalogPort,
  input: NormalizedScreeningInput,
): Promise<CompanyResearchFinding> {
  const company = await catalog.findByNameOrDomain(input);
  if (!company) {
    return { profile: {}, sources: [], companyId: null, available: false };
  }
  return {
    profile: profileFromLocalCompany(company),
    sources: [localCatalogSource(company)],
    companyId: company.id,
    available: true,
  };
}
