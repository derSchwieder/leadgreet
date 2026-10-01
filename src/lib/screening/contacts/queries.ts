import { companySearchLabel } from "@/lib/research/brave/queries";
import type { NormalizedScreeningInput } from "../normalize";
import { type ContactTheme, deriveContactThemes } from "./themes";

export const MAX_CONTACT_QUERIES = 5;

const LINKEDIN_SUFFIXES = [
  "site:linkedin.com CIO CTO CDO",
  'site:linkedin.com "Head of AI" "Digital Transformation"',
];

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
  // Reserve query slots for LinkedIn so signal-derived themes cannot crowd it out.
  const suffixes = [
    "Chief Digital Officer",
    ...LINKEDIN_SUFFIXES,
    ...themes.map((theme) => theme.querySuffix),
    ...FALLBACK_SUFFIXES,
  ];
  const queries: string[] = [];
  const seen = new Set<string>();
  for (const suffix of suffixes) {
    const query = suffix.startsWith("site:")
      ? `${suffix} ${label}`.replace(/\\s+/g, " ").trim()
      : `${label} ${suffix}`.replace(/\\s+/g, " ").trim();
    const key = query.toLocaleLowerCase("de");
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(query);
    if (queries.length >= MAX_CONTACT_QUERIES) break;
  }
  return queries;
}
