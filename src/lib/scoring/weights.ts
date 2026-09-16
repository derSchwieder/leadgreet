/**
 * Central scoring weights for the leadgreet opportunity engine.
 *
 * Component scores are 0–100. Each weight is the maximum contribution
 * that component can add to the opportunity score. Weights MUST sum to 100
 * so the total remains an explainable 0–100 score.
 *
 * Change weights here only — UI and API read from this module.
 */
export const SCORING_WEIGHTS = {
  signalStrength: 25,
  freshness: 20,
  companyFit: 20,
  contactFit: 15,
  confidence: 20,
} as const;

export type ScoringDimension = keyof typeof SCORING_WEIGHTS;

export const SCORING_DIMENSIONS: readonly ScoringDimension[] = [
  "signalStrength",
  "freshness",
  "companyFit",
  "contactFit",
  "confidence",
] as const;

export function assertWeightsSumTo100(): void {
  const total = SCORING_DIMENSIONS.reduce(
    (sum, key) => sum + SCORING_WEIGHTS[key],
    0,
  );
  if (total !== 100) {
    throw new Error(`SCORING_WEIGHTS must sum to 100, got ${total}`);
  }
}

export const HOT_OPPORTUNITY_THRESHOLD = 70;

export const TARGET_COMPANY_PROFILE = {
  preferredIndustries: [
    "automotive",
    "manufacturing",
    "industrial",
    "logistics",
    "electronics",
    "engineering",
    "machinery",
    "mobility",
  ],
  preferredSizes: ["MEDIUM", "LARGE", "ENTERPRISE"] as const,
  preferredCountries: [
    "DE",
    "AT",
    "CH",
    "Germany",
    "Austria",
    "Switzerland",
    "Deutschland",
    "Österreich",
    "Schweiz",
  ],
  minEmployees: 50,
} as const;
