import type { ScoreFactor } from "@/types/models";
import { SCORING_WEIGHTS } from "./weights";
import type { OpportunityScoreResult } from "./types";

const DIMENSION_LABEL: Record<keyof typeof SCORING_WEIGHTS, string> = {
  signalStrength: "Signalstärke",
  freshness: "Aktualität",
  companyFit: "Unternehmens-Fit",
  contactFit: "Kontakt-Fit",
  confidence: "Sicherheit",
};

export function buildExplanation(result: Omit<OpportunityScoreResult, "explanation" | "whyNow">): string {
  const lines: string[] = [
    `Greet: ${result.opportunityScore}`,
    "",
    `Signalstärke: ${result.signalStrength}`,
    `Aktualität: ${result.freshness}`,
    `Unternehmens-Fit: ${result.companyFit}`,
    `Kontakt-Fit: ${result.contactFit}`,
    `Sicherheit: ${result.confidence}`,
    "",
    "Gewichtete Beiträge (max. 100):",
  ];

  (Object.keys(SCORING_WEIGHTS) as Array<keyof typeof SCORING_WEIGHTS>).forEach((key) => {
    const weight = SCORING_WEIGHTS[key];
    const contributionValue = result.contributions[key];
    const sign = contributionValue >= 0 ? "+" : "";
    lines.push(
      `${sign}${contributionValue} ${DIMENSION_LABEL[key]} (${result[key]}/100 × Gewicht ${weight})`,
    );
  });

  lines.push("", "Faktor-Details:");
  result.factors.forEach((factor) => {
    const sign = factor.points >= 0 ? "+" : "";
    lines.push(`${sign}${factor.points} ${factor.label} — ${factor.detail}`);
  });

  return lines.join("\n");
}

export function buildWhyNow(factors: ScoreFactor[], freshnessScore: number): string {
  const positives = factors
    .filter((factor) => factor.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((factor) => factor.detail);

  const timing =
    freshnessScore >= 90
      ? "Das auslösende Signal ist aktuell (unter 30 Tagen)."
      : freshnessScore >= 70
        ? "Das Signal ist noch aktuell genug, um in diesem Quartal zu handeln."
        : "Das Signal altert — die Ansprache sollte jetzt erfolgen, sonst schließt sich das Zeitfenster.";

  if (positives.length === 0) {
    return timing;
  }

  return `${timing} ${positives.join(" ")}`;
}

export function formatContributionLine(
  label: string,
  points: number,
  detail: string,
): string {
  const sign = points >= 0 ? "+" : "";
  return `${sign}${points} ${label}${detail ? ` — ${detail}` : ""}`;
}
