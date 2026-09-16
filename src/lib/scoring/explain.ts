import type { ScoreFactor } from "@/types/models";
import { SCORING_WEIGHTS } from "./weights";
import type { OpportunityScoreResult } from "./types";

const DIMENSION_LABEL: Record<keyof typeof SCORING_WEIGHTS, string> = {
  signalStrength: "Signal Strength",
  freshness: "Freshness",
  companyFit: "Company Fit",
  contactFit: "Contact Fit",
  confidence: "Confidence",
};

export function buildExplanation(result: Omit<OpportunityScoreResult, "explanation" | "whyNow">): string {
  const lines: string[] = [
    `Opportunity Score: ${result.opportunityScore}`,
    "",
    `Signal Strength: ${result.signalStrength}`,
    `Freshness: ${result.freshness}`,
    `Company Fit: ${result.companyFit}`,
    `Contact Fit: ${result.contactFit}`,
    `Confidence: ${result.confidence}`,
    "",
    "Weighted contributions (max 100):",
  ];

  (Object.keys(SCORING_WEIGHTS) as Array<keyof typeof SCORING_WEIGHTS>).forEach((key) => {
    const weight = SCORING_WEIGHTS[key];
    const contributionValue = result.contributions[key];
    const sign = contributionValue >= 0 ? "+" : "";
    lines.push(
      `${sign}${contributionValue} ${DIMENSION_LABEL[key]} (${result[key]}/100 × weight ${weight})`,
    );
  });

  lines.push("", "Factor detail:");
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
      ? "The triggering signal is current (under 30 days)."
      : freshnessScore >= 70
        ? "The signal is still recent enough to act this quarter."
        : "The signal is aging — outreach should happen now or the window closes.";

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
