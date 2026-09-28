import { companySearchLabel } from "@/lib/research/brave/queries";
import type { NormalizedScreeningInput } from "../normalize";
import { type ContactTheme, deriveContactThemes } from "./themes";

export const MAX_CONTACT_QUERIES = 5;

const FALLBACK_SUFFIXES = [
  "Chief Digital Officer",
  "digitalization leadership",
  "IT leadership",
  "AI data leadership",
  "transformation leadership",
];

export function buildContactResearchQueries(
  input: NormalizedScreeningInput,
  themes: readonly ContactTheme[] = deriveContactThemes([]),
): string[] {
  const label = companySearchLabel(input.name);
  const suffixes = [
    "Chief Digital Officer",
    ...themes.map((theme) => theme.querySuffix),
    ...FALLBACK_SUFFIXES,
  ];
  const queries: string[] = [];
  const seen = new Set<string>();
  for (const suffix of suffixes) {
    const query = `${label} ${suffix}`.replace(/\s+/g, " ").trim();
    const key = query.toLocaleLowerCase("de");
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(query);
    if (queries.length >= MAX_CONTACT_QUERIES) break;
  }
  return queries;
}
