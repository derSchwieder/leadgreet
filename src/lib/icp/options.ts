import { translateCountry, translateIndustry } from "@/lib/labels";
import { canonicalCountry, canonicalIndustry } from "./match";

export type IcpFilterOption = {
  value: string;
  label: string;
};

export function collectIndustryOptions(
  companies: ReadonlyArray<{ industry?: string | null }>,
): IcpFilterOption[] {
  return collectPresentOptions(
    companies.map((company) => company.industry),
    canonicalIndustry,
    translateIndustry,
  );
}

export function collectCountryOptions(
  companies: ReadonlyArray<{ country?: string | null }>,
): IcpFilterOption[] {
  return collectPresentOptions(
    companies.map((company) => company.country),
    canonicalCountry,
    translateCountry,
  );
}

function collectPresentOptions(
  values: ReadonlyArray<string | null | undefined>,
  canonicalize: (value: string) => string,
  labelize: (value: string) => string,
): IcpFilterOption[] {
  const byKey = new Map<string, IcpFilterOption>();
  for (const value of values) {
    const present = value?.trim();
    if (!present) continue;
    const key = canonicalize(present);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, { value: present, label: labelize(present) });
  }
  return [...byKey.values()].sort((left, right) => left.label.localeCompare(right.label, "de"));
}
