import { normalizeScreeningDomain, type NormalizedScreeningInput } from "@/lib/screening/normalize";
import { sanitizeSearchQuery } from "./sanitize";

export const MAX_SCREENING_QUERIES = 5;

export function companySearchLabel(name: string): string {
  const sanitized = sanitizeSearchQuery(name);
  if (sanitized) return sanitized;
  return name.trim().split(/\s+/)[0] ?? name.trim();
}

/**
 * Generic screening queries. Never hardcode a specific company.
 * At most five queries: official-domain first when a domain exists, plus external sources.
 */
export function buildCompanyResearchQueries(input: NormalizedScreeningInput): string[] {
  const label = companySearchLabel(input.name);
  const domain = normalizeScreeningDomain(input.domain);
  const queries = domain
    ? [
        `site:${domain} ${label} Unternehmen Produkte Dienstleistungen`,
        `${label} KI Digitalisierung AI`,
        `${label} aktuelle News Strategie Investitionen`,
        `${label} KI Data IT Jobs Stellenangebote`,
        `${label} Cloud Digitalisierung Transformation`,
      ]
    : [
        `${label} Unternehmen Produkte Dienstleistungen`,
        `${label} KI Digitalisierung AI`,
        `${label} aktuelle News Strategie Investitionen`,
        `${label} KI Data IT Jobs Stellenangebote`,
        `${label} Cloud Digitalisierung Transformation`,
      ];
  return queries.slice(0, MAX_SCREENING_QUERIES);
}
