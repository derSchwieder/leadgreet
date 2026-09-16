import {
  clampScore,
  type ComponentScoreResult,
  type ScoringCompanyInput,
  type ScoringContactInput,
  type ScoringSignalInput,
} from "./types";

export function scoreConfidence(input: {
  company: ScoringCompanyInput;
  signals: ScoringSignalInput[];
  contact: ScoringContactInput | null;
}): ComponentScoreResult {
  const { company, signals, contact } = input;
  const factors: ComponentScoreResult["factors"] = [];
  let score = 30;

  factors.push({
    code: "baseline",
    label: "Baseline confidence",
    points: 30,
    detail: "Start from a conservative baseline until evidence accumulates.",
  });

  const primary = signals[0];
  if (primary?.sourceCredibility !== null && primary?.sourceCredibility !== undefined) {
    const points = Math.round(primary.sourceCredibility * 0.35);
    score += points;
    factors.push({
      code: "source_credibility",
      label: "Source credibility",
      points,
      detail: `Primary source credibility ${primary.sourceCredibility}/100.`,
    });
  } else if (signals.length > 0) {
    score += 10;
    factors.push({
      code: "unsourced",
      label: "Limited source metadata",
      points: 10,
      detail: "A signal exists but source credibility is unknown.",
    });
  }

  const withUrl = signals.filter((signal) => Boolean(signal.sourceUrl)).length;
  if (withUrl > 0) {
    score += 8;
    factors.push({
      code: "evidence_url",
      label: "Source evidence URL",
      points: 8,
      detail: "At least one signal has a source URL that can be reviewed.",
    });
  }

  const companyFields = [
    company.industry,
    company.country,
    company.employees,
    company.website,
  ].filter(Boolean).length;
  if (companyFields >= 3) {
    score += 10;
    factors.push({
      code: "company_complete",
      label: "Company profile completeness",
      points: 10,
      detail: "Core company fields are populated.",
    });
  } else if (companyFields === 0) {
    score -= 8;
    factors.push({
      code: "company_sparse",
      label: "Sparse company profile",
      points: -8,
      detail: "Company record is name-only; confidence is reduced.",
    });
  }

  if (contact) {
    score += Math.round(contact.confidenceScore * 0.15);
    factors.push({
      code: "contact_confidence",
      label: "Contact confidence",
      points: Math.round(contact.confidenceScore * 0.15),
      detail: `Contact confidence ${contact.confidenceScore}/100.`,
    });
  }

  if (signals.length >= 2) {
    score += 8;
    factors.push({
      code: "corroboration",
      label: "Multiple signals",
      points: 8,
      detail: "Independent signals corroborate the opportunity.",
    });
  }

  return { score: clampScore(score), factors };
}
