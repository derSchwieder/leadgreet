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
    label: "Basisvertrauen",
    points: 30,
    detail: "Konservativer Startwert, bis sich weitere Belege ansammeln.",
  });

  const primary = signals[0];
  if (primary?.sourceCredibility !== null && primary?.sourceCredibility !== undefined) {
    const points = Math.round(primary.sourceCredibility * 0.35);
    score += points;
    factors.push({
      code: "source_credibility",
      label: "Quellenqualität",
      points,
      detail: `Glaubwürdigkeit der Hauptquelle ${primary.sourceCredibility}/100.`,
    });
  } else if (signals.length > 0) {
    score += 10;
    factors.push({
      code: "unsourced",
      label: "Begrenzte Quellenangaben",
      points: 10,
      detail: "Ein Signal liegt vor, die Glaubwürdigkeit der Quelle ist aber unbekannt.",
    });
  }

  const withUrl = signals.filter((signal) => Boolean(signal.sourceUrl)).length;
  if (withUrl > 0) {
    score += 8;
    factors.push({
      code: "evidence_url",
      label: "Quellen-URL",
      points: 8,
      detail: "Mindestens ein Signal hat eine überprüfbare Quellen-URL.",
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
      label: "Unternehmensprofil vollständig",
      points: 10,
      detail: "Die zentralen Unternehmensfelder sind hinterlegt.",
    });
  } else if (companyFields === 0) {
    score -= 8;
    factors.push({
      code: "company_sparse",
      label: "Dünnes Unternehmensprofil",
      points: -8,
      detail: "Zum Unternehmen ist nur der Name bekannt; das Vertrauen sinkt.",
    });
  }

  if (contact) {
    score += Math.round(contact.confidenceScore * 0.15);
    factors.push({
      code: "contact_confidence",
      label: "Kontaktvertrauen",
      points: Math.round(contact.confidenceScore * 0.15),
      detail: `Kontaktvertrauen ${contact.confidenceScore}/100.`,
    });
  }

  if (signals.length >= 2) {
    score += 8;
    factors.push({
      code: "corroboration",
      label: "Mehrere Signale",
      points: 8,
      detail: "Unabhängige Signale stützen die Chance.",
    });
  }

  return { score: clampScore(score), factors };
}
