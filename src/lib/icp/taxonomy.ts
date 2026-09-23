import { canonicalIndustry } from "./match";
import type { IcpFilterOption } from "./options";

/**
 * Slim selectable industry list for RadarProfile.
 * Values are written as stored ICP strings. Automotive uses "Automobil"
 * so matchesIcp still matches existing company rows. Company.industry
 * is never rewritten from this list.
 */
export const RADAR_INDUSTRY_TAXONOMY: readonly IcpFilterOption[] = [
  { value: "Banken", label: "Banken" },
  { value: "Versicherungen", label: "Versicherungen" },
  { value: "Automobil", label: "Automotive" },
  { value: "Industrie", label: "Industrie" },
  { value: "Logistik", label: "Logistik" },
  { value: "Handel", label: "Handel" },
  { value: "FinTech", label: "FinTech" },
  { value: "Digital Health", label: "Digital Health" },
  { value: "Software", label: "Software / IT" },
  { value: "Energie", label: "Energie" },
  { value: "Sonstige", label: "Sonstige" },
];

export function mergeIndustryOptions(
  present: readonly IcpFilterOption[],
  taxonomy: readonly IcpFilterOption[] = RADAR_INDUSTRY_TAXONOMY,
): IcpFilterOption[] {
  const byKey = new Map<string, IcpFilterOption>();
  for (const option of taxonomy) {
    const key = canonicalIndustry(option.value);
    if (!key) continue;
    byKey.set(key, option);
  }
  for (const option of present) {
    const key = canonicalIndustry(option.value);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, option);
  }
  return [...byKey.values()].sort((left, right) => left.label.localeCompare(right.label, "de"));
}
