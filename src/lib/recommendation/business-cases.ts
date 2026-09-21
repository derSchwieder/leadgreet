import { BUSINESS_CASE_LABELS } from "@/lib/labels";
import type { BusinessCaseType } from "@/types";
import type {
  BusinessCaseHypothesis,
  RecommendationService,
  RecommendationSignal,
} from "./types";

/**
 * How strongly unique supporting signal types lift a hypothesis.
 * Index = number of distinct mapped types; extra types stay at the last step.
 */
export const BUSINESS_CASE_UNIQUE_TYPE_SCORE = [0, 74, 88, 96, 100] as const;

export const BUSINESS_CASE_CONFIDENCE = {
  uniqueTypeWeight: 82,
  signalStrengthWeight: 18,
} as const;

/** Hypotheses below this support level are dropped, not invented. */
export const MIN_BUSINESS_CASE_CONFIDENCE = 50;

/**
 * Signal → possible economic levers. These are hypotheses, not facts
 * about the customer.
 */
export const SIGNAL_BUSINESS_CASES: Record<string, readonly BusinessCaseType[]> = {
  AI_PROJECT: ["REVENUE_GROWTH", "COST_REDUCTION", "CAPACITY"],
  AI_STRATEGY: ["REVENUE_GROWTH", "COST_REDUCTION", "CAPACITY"],
  GENAI: ["REVENUE_GROWTH", "COST_REDUCTION", "CAPACITY"],
  AI_AGENT: ["REVENUE_GROWTH", "COST_REDUCTION", "CAPACITY"],
  AI_RECRUITING: ["REVENUE_GROWTH", "COST_REDUCTION", "CAPACITY"],
  PROCESS_AUTOMATION: ["COST_REDUCTION", "CAPACITY"],
  IT_RECRUITING: ["CAPACITY"],
  SOFTWARE_MODERNIZATION: ["COST_REDUCTION", "CAPACITY", "RISK_REDUCTION"],
  CLOUD_MIGRATION: ["COST_REDUCTION", "CAPACITY", "RISK_REDUCTION"],
  EXPANSION: ["REVENUE_GROWTH", "CAPACITY"],
  FUNDING: ["REVENUE_GROWTH", "CAPACITY"],
  M_AND_A: ["CAPACITY", "COST_REDUCTION", "RISK_REDUCTION"],
  DATA_PLATFORM: ["COST_REDUCTION", "REVENUE_GROWTH", "CAPACITY"],
  DATA_ANALYTICS: ["COST_REDUCTION", "REVENUE_GROWTH", "CAPACITY"],
  ERP_TRANSFORMATION: ["COST_REDUCTION", "CAPACITY", "RISK_REDUCTION"],
  DIGITAL_TRANSFORMATION: ["COST_REDUCTION", "CAPACITY", "RISK_REDUCTION"],
  INVESTMENT: ["REVENUE_GROWTH", "CAPACITY"],
};

const SIGNAL_CASE_REASONS: Record<string, Partial<Record<BusinessCaseType, string>>> = {
  IT_RECRUITING: {
    CAPACITY:
      "Aktuelle IT-Rekrutierung deutet auf zusätzlichen Ressourcenbedarf hin",
  },
  PROCESS_AUTOMATION: {
    COST_REDUCTION:
      "Das Signal kann auf Potenzial zur Reduzierung manueller Aufwände hindeuten.",
    CAPACITY:
      "Prozessautomatisierung kann auf den Wunsch nach zusätzlicher operativer Kapazität hindeuten.",
  },
  EXPANSION: {
    REVENUE_GROWTH:
      "Ein Expansionssignal kann auf Umsatzwachstum als möglichen wirtschaftlichen Hebel hindeuten.",
    CAPACITY:
      "Expansion kann auf zusätzlichen Umsetzungs- oder Lieferbedarf hindeuten.",
  },
  FUNDING: {
    REVENUE_GROWTH:
      "Eine Finanzierungsrunde kann auf geplantes Wachstum als möglichen wirtschaftlichen Hebel hindeuten.",
    CAPACITY:
      "Neue Finanzierung kann auf den Aufbau zusätzlicher Umsetzungsfähigkeit hindeuten.",
  },
  SOFTWARE_MODERNIZATION: {
    COST_REDUCTION:
      "Software-Modernisierung kann auf Potenzial zur Reduzierung von Betriebsaufwänden hindeuten.",
    CAPACITY:
      "Software-Modernisierung kann auf fehlende Kapazität in bestehenden Anwendungen hindeuten.",
    RISK_REDUCTION:
      "Software-Modernisierung kann auf das Ziel hinweisen, technische Risiken zu reduzieren.",
  },
  CLOUD_MIGRATION: {
    COST_REDUCTION:
      "Ein Cloud-Migrationssignal kann auf den möglichen Hebel Kosten senken hindeuten.",
    CAPACITY:
      "Cloud-Migration kann auf den Bedarf nach skalierbarer Kapazität hindeuten.",
    RISK_REDUCTION:
      "Cloud-Migration kann auf das Ziel hinweisen, Risiken bestehender Infrastruktur zu reduzieren.",
  },
  AI_PROJECT: {
    REVENUE_GROWTH:
      "Ein KI-Projekt kann auf neue datenbasierte Erlöspotenziale als möglichen Hebel hindeuten.",
    COST_REDUCTION:
      "Ein KI-Projekt kann auf Potenzial zur Reduzierung manueller Aufwände hindeuten.",
    CAPACITY:
      "Ein KI-Projekt kann auf fehlende interne Umsetzungskapazität hindeuten.",
  },
  AI_STRATEGY: {
    REVENUE_GROWTH:
      "Eine KI-Strategie kann auf Wachstum durch datenbasierte Angebote hindeuten.",
    COST_REDUCTION:
      "Eine KI-Strategie kann auf Effizienzhebel in bestehenden Prozessen hindeuten.",
    CAPACITY:
      "Eine KI-Strategie kann auf den Aufbau zusätzlicher KI-Umsetzungskapazität hindeuten.",
  },
  GENAI: {
    REVENUE_GROWTH:
      "Ein Generative-KI-Signal kann auf neue produktive Anwendungsfälle als Hebel hindeuten.",
    COST_REDUCTION:
      "Generative KI kann auf Potenzial zur Reduzierung manueller Aufwände hindeuten.",
    CAPACITY:
      "Generative KI kann auf den Wunsch nach zusätzlicher Bearbeitungskapazität hindeuten.",
  },
  M_AND_A: {
    CAPACITY:
      "Ein M&A-Signal kann auf Integrations- und Kapazitätsbedarf hindeuten.",
    COST_REDUCTION:
      "Ein M&A-Signal kann auf Konsolidierung als möglichen Kostenhebel hindeuten.",
    RISK_REDUCTION:
      "Ein M&A-Signal kann auf das Ziel hinweisen, Integrationsrisiken zu reduzieren.",
  },
};

const CASE_REASON_FALLBACK: Record<BusinessCaseType, string> = {
  COST_REDUCTION:
    "Das Signal kann auf Potenzial zur Reduzierung manueller Aufwände hindeuten.",
  REVENUE_GROWTH:
    "Das Signal kann auf Umsatzwachstum als möglichen wirtschaftlichen Hebel hindeuten.",
  CAPACITY:
    "Das Signal kann auf zusätzlichen Ressourcen- oder Kapazitätsbedarf hindeuten.",
  RISK_REDUCTION:
    "Das Signal kann auf das Ziel hinweisen, technische oder operative Risiken zu reduzieren.",
};

const VALUE_PROPOSITION_HINTS: Record<BusinessCaseType, readonly string[]> = {
  COST_REDUCTION: [
    "kosten",
    "aufwand",
    "aufwände",
    "automatis",
    "effizient",
    "manuell",
    "senken",
    "nutzbar",
    "modernis",
  ],
  REVENUE_GROWTH: [
    "umsatz",
    "geschäftsmodell",
    "geschäftsmodelle",
    "produkte",
    "wachstum",
    "geschäft",
  ],
  CAPACITY: [
    "kapazität",
    "ressourcen",
    "entlasten",
    "betrieb",
    "entwicklungskapazität",
    "bereitstellen",
    "teams",
  ],
  RISK_REDUCTION: [
    "risiko",
    "risiken",
    "modernis",
    "altsystem",
    "veraltet",
    "stabil",
  ],
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueTypeScore(count: number): number {
  const table = BUSINESS_CASE_UNIQUE_TYPE_SCORE;
  if (count <= 0) return 0;
  return table[Math.min(count, table.length - 1)] ?? 100;
}

function caseLabel(type: BusinessCaseType): string {
  return BUSINESS_CASE_LABELS[type] ?? type;
}

function reasonForSignal(signalType: string, caseType: BusinessCaseType): string {
  return SIGNAL_CASE_REASONS[signalType]?.[caseType] ?? CASE_REASON_FALLBACK[caseType];
}

function sortHypotheses(a: BusinessCaseHypothesis, b: BusinessCaseHypothesis): number {
  if (b.confidence !== a.confidence) return b.confidence - a.confidence;
  return a.type.localeCompare(b.type);
}

export function selectPrimaryBusinessCase(
  hypotheses: BusinessCaseHypothesis[],
): BusinessCaseHypothesis | null {
  const top = hypotheses[0];
  if (!top) return null;
  const tied = hypotheses.filter((item) => item.confidence === top.confidence);
  if (tied.length !== 1) return null;
  return top;
}

function buildHypothesis(
  type: BusinessCaseType,
  supporting: RecommendationSignal[],
): BusinessCaseHypothesis | null {
  const uniqueTypes: string[] = [];
  const seenTypes = new Set<string>();
  for (const signal of supporting) {
    if (seenTypes.has(signal.type)) continue;
    seenTypes.add(signal.type);
    uniqueTypes.push(signal.type);
  }

  const avgStrength =
    supporting.reduce((sum, signal) => sum + signal.signalStrength, 0) /
    supporting.length;
  const confidence = clampScore(
    uniqueTypeScore(uniqueTypes.length) *
      (BUSINESS_CASE_CONFIDENCE.uniqueTypeWeight / 100) +
      avgStrength * (BUSINESS_CASE_CONFIDENCE.signalStrengthWeight / 100),
  );

  if (confidence < MIN_BUSINESS_CASE_CONFIDENCE) return null;

  const reasons = [`Möglicher Business Case: ${caseLabel(type)}`];
  const seenReasons = new Set(reasons);
  for (const signalType of uniqueTypes) {
    const reason = reasonForSignal(signalType, type);
    if (seenReasons.has(reason)) continue;
    seenReasons.add(reason);
    reasons.push(reason);
  }

  const supportingSignals: string[] = [];
  const seenTitles = new Set<string>();
  for (const signal of supporting) {
    const title = signal.title.trim();
    if (!title || seenTitles.has(title)) continue;
    seenTitles.add(title);
    supportingSignals.push(title);
  }

  return {
    type,
    confidence,
    reasons,
    supportingSignals,
    valuePropositions: [],
  };
}

/**
 * Derive business-case hypotheses from observed signals.
 * Does not invent financial outcomes or pick an artificial winner.
 */
export function inferBusinessCases(
  signals: RecommendationSignal[],
): BusinessCaseHypothesis[] {
  const byType = new Map<BusinessCaseType, RecommendationSignal[]>();

  for (const signal of signals) {
    const cases = SIGNAL_BUSINESS_CASES[signal.type];
    if (!cases) continue;
    for (const type of cases) {
      const existing = byType.get(type);
      if (existing) {
        existing.push(signal);
      } else {
        byType.set(type, [signal]);
      }
    }
  }

  const hypotheses: BusinessCaseHypothesis[] = [];
  for (const [type, supporting] of byType) {
    const hypothesis = buildHypothesis(type, supporting);
    if (hypothesis) hypotheses.push(hypothesis);
  }

  return hypotheses.sort(sortHypotheses);
}

export function selectValuePropositions(
  service: RecommendationService,
  type: BusinessCaseType,
): string[] {
  const propositions = service.valuePropositions ?? [];
  if (propositions.length === 0) return [];
  const hints = VALUE_PROPOSITION_HINTS[type];
  return propositions.filter((proposition) => {
    const haystack = proposition.toLowerCase();
    return hints.some((hint) => haystack.includes(hint));
  });
}

/**
 * Restrict opportunity-level hypotheses to the service portfolio.
 * Empty `businessCaseTypes` does not invent cases; it only skips filtering.
 */
export function attachBusinessCases(
  service: RecommendationService,
  hypotheses: BusinessCaseHypothesis[],
): {
  businessCases: BusinessCaseHypothesis[];
  primaryBusinessCase: BusinessCaseHypothesis | null;
} {
  const allowed = (service.businessCaseTypes ?? []).map((type) => String(type));
  const matching =
    allowed.length === 0
      ? hypotheses
      : hypotheses.filter((item) => allowed.includes(item.type));

  const businessCases = matching
    .map((item) => ({
      ...item,
      reasons: [...item.reasons],
      supportingSignals: [...item.supportingSignals],
      valuePropositions: selectValuePropositions(service, item.type),
    }))
    .sort(sortHypotheses);

  return {
    businessCases,
    primaryBusinessCase: selectPrimaryBusinessCase(businessCases),
  };
}
