import { COUNTRY_LABELS, translateIndustry } from "@/lib/labels";
import { normalizeSearchQuery } from "@/lib/search/entity-search";

export type IcpCompanyInput = {
  industry?: string | null;
  country?: string | null;
  employees?: number | null;
  revenue?: string | number | null;
};

export type IcpRangeFilter = {
  min?: number | null;
  max?: number | null;
};

export type IcpProfile = {
  industries?: readonly string[] | null;
  countries?: readonly string[] | null;
  employees?: IcpRangeFilter | null;
  revenue?: IcpRangeFilter | null;
};

export function matchesIcp(
  company: IcpCompanyInput,
  icp: IcpProfile | null | undefined,
): boolean {
  if (isEmptyIcp(icp)) return true;

  if (!matchesListedValue(company.industry, icp?.industries, canonicalIndustry)) return false;
  if (!matchesListedValue(company.country, icp?.countries, canonicalCountry)) return false;
  if (!matchesRange(company.employees, icp?.employees, parseEmployeeCount)) return false;
  if (!matchesRange(company.revenue, icp?.revenue, parseRevenueAmount)) return false;

  return true;
}

function isEmptyIcp(icp: IcpProfile | null | undefined): boolean {
  if (!icp) return true;
  return (
    !hasListedFilter(icp.industries) &&
    !hasListedFilter(icp.countries) &&
    !hasRangeFilter(icp.employees) &&
    !hasRangeFilter(icp.revenue)
  );
}

function hasListedFilter(values: readonly string[] | null | undefined): boolean {
  return presentStrings(values).length > 0;
}

function hasRangeFilter(range: IcpRangeFilter | null | undefined): boolean {
  if (!range) return false;
  return readFiniteNumber(range.min) != null || readFiniteNumber(range.max) != null;
}

function matchesListedValue(
  value: string | null | undefined,
  allowed: readonly string[] | null | undefined,
  canonicalize: (value: string) => string,
): boolean {
  const options = presentStrings(allowed).map(canonicalize).filter(Boolean);
  if (options.length === 0) return true;

  const present = presentString(value);
  if (present == null) return false;

  const needle = canonicalize(present);
  if (!needle) return false;
  return options.includes(needle);
}

function matchesRange(
  value: string | number | null | undefined,
  range: IcpRangeFilter | null | undefined,
  parse: (value: string | number | null | undefined) => number | null,
): boolean {
  if (!hasRangeFilter(range)) return true;

  const amount = parse(value);
  if (amount == null) return false;

  const min = readFiniteNumber(range?.min);
  const max = readFiniteNumber(range?.max);
  if (min != null && amount < min) return false;
  if (max != null && amount > max) return false;
  return true;
}

function presentString(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function presentStrings(values: readonly string[] | null | undefined): string[] {
  if (!values?.length) return [];
  return values.flatMap((value) => {
    const present = presentString(value);
    return present ? [present] : [];
  });
}

export function canonicalIndustry(value: string): string {
  return normalizeSearchQuery(translateIndustry(value.trim()));
}

export function canonicalCountry(value: string): string {
  const trimmed = value.trim();
  const mapped =
    COUNTRY_LABELS[trimmed] ??
    COUNTRY_LABELS[trimmed.toUpperCase()] ??
    countryLabelByNormalizedKey(trimmed);
  return normalizeSearchQuery(mapped ?? trimmed);
}

function countryLabelByNormalizedKey(value: string): string | undefined {
  const needle = normalizeSearchQuery(value);
  for (const [key, label] of Object.entries(COUNTRY_LABELS)) {
    if (normalizeSearchQuery(key) === needle || normalizeSearchQuery(label) === needle) {
      return label;
    }
  }
  return undefined;
}

function readFiniteNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseEmployeeCount(value: string | number | null | undefined): number | null {
  return typeof value === "number" ? readFiniteNumber(value) : null;
}

function parseRevenueAmount(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return readFiniteNumber(value);
  const present = presentString(value);
  if (present == null) return null;
  const amount = Number(present);
  return Number.isFinite(amount) ? amount : null;
}
