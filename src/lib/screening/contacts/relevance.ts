import type { ContactTheme } from "./themes";
import type { ContactResearchRelevance } from "./types";

const ROLE_THEME_HINTS: Array<{ themeId: string; match: RegExp }> = [
  { themeId: "digitalization", match: /digital|cdo|transformation|cio/i },
  { themeId: "it", match: /\bit\b|cio|technology|infrastructure|architecture|platform/i },
  { themeId: "ai", match: /\bai\b|\bki\b|data|analytics|machine learning|smart factory/i },
  { themeId: "cloud", match: /cloud|infrastructure|platform|architecture/i },
  { themeId: "transformation", match: /transformation|digital|cdo|smart factory/i },
];

export function scoreContactRelevance(
  role: string,
  themes: readonly ContactTheme[],
): {
  relevance: ContactResearchRelevance;
  relatedSignals: string[];
  relevanceReason: string;
} | null {
  const related = themes.filter((item) =>
    ROLE_THEME_HINTS.some((hint) => hint.themeId === item.id && hint.match.test(role)),
  );
  if (related.length === 0) return null;
  const labels = related.map((theme) => theme.label);
  const high = related.some((theme) =>
    /digital|cdo|cio|ai|data|cloud|transformation/i.test(role),
  );
  return {
    relevance: high ? "high" : "medium",
    relatedSignals: labels,
    relevanceReason: `Die öffentlich belegte Funktion ist mit ${labels.join(", ")} verbunden.`,
  };
}
