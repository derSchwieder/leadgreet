import type { ScreeningWebResearchResult } from "@/types";

export type ContactTheme = {
  id: string;
  label: string;
  querySuffix: string;
};

const THEME_RULES: Array<{ id: string; label: string; querySuffix: string; match: RegExp }> = [
  {
    id: "digitalization",
    label: "Digitale Transformation",
    querySuffix: "digitalization leadership",
    match: /digital|digitalis|digital transformation|chief digital|\bcdo\b/i,
  },
  {
    id: "it",
    label: "IT & Digitalization",
    querySuffix: "IT leadership",
    match: /\bcio\b|information technology|\bit leadership\b|\bit & digital/i,
  },
  {
    id: "ai",
    label: "KI / AI",
    querySuffix: "AI data leadership",
    match: /\bai\b|\bki\b|artificial intelligence|machine learning|data analytics|data & analytics/i,
  },
  {
    id: "cloud",
    label: "Cloud",
    querySuffix: "CIO",
    match: /\bcloud\b|infrastructure|digital platform/i,
  },
  {
    id: "transformation",
    label: "Transformation",
    querySuffix: "transformation leadership",
    match: /transformation|smart factory|industrie 4|industrial digital/i,
  },
];

export function deriveContactThemes(
  results: readonly ScreeningWebResearchResult[],
  extraLabels: readonly string[] = [],
): ContactTheme[] {
  const blob = [...results.map((item) => `${item.title} ${item.description ?? ""}`), ...extraLabels]
    .join(" \n ")
    .toLocaleLowerCase("de");
  const found = THEME_RULES.filter((rule) => rule.match.test(blob));
  if (found.length > 0) return found;
  return [THEME_RULES[0]!];
}
