import { formatDate } from "@/lib/format";
import { BUSINESS_CASE_LABELS, SIGNAL_TYPE_LABELS } from "@/lib/labels";
import type {
  BusinessCaseHypothesis,
  RecommendationResult,
  ServiceRecommendation,
} from "@/lib/recommendation";

export const BUSINESS_CASE_EMPTY_MESSAGE =
  "Für diese Opportunity konnte noch kein belastbarer Business Case abgeleitet werden.";

export const BUSINESS_CASE_FRAMING =
  "Die aktuellen Signale deuten darauf hin, dass hier ein wirtschaftlicher Hebel in diesem Bereich liegen könnte.";

export type OpportunitySignalRef = {
  title: string;
  type: string;
  detectedAt?: Date | string | null;
};

export type BusinessCaseSignalView = {
  title: string;
  type: string | null;
  typeLabel: string | null;
  detectedAt: string | null;
};

export type BusinessCaseView = {
  type: string;
  label: string;
  hypothesis: string | null;
  confidence: number | null;
  supportingSignals: BusinessCaseSignalView[];
  valueProposition: string | null;
  serviceName: string | null;
  serviceFit: number | null;
  conversationStarter: string | null;
};

export type BusinessCasePresentation = {
  heading: "Möglicher Business Case" | "Mögliche Business Cases";
  cases: BusinessCaseView[];
  empty: boolean;
  emptyMessage: string;
};

export function businessCaseLabel(type: string): string {
  return BUSINESS_CASE_LABELS[type] ?? type;
}

function signalTypeLabel(type: string | null): string | null {
  if (!type) return null;
  return SIGNAL_TYPE_LABELS[type] ?? type;
}

/** Keep the engine's primary when unique; otherwise keep every top-confidence tie. */
export function selectVisibleBusinessCases(
  result: RecommendationResult,
): BusinessCaseHypothesis[] {
  if (result.primaryBusinessCase) {
    return [result.primaryBusinessCase];
  }

  const ranked = result.businessCases;
  const top = ranked[0];
  if (!top) return [];

  return ranked.filter((item) => item.confidence === top.confidence);
}

function bestServiceForCase(
  result: RecommendationResult,
  type: string,
): ServiceRecommendation | null {
  for (const recommendation of result.recommendations) {
    if (recommendation.businessCases.some((item) => item.type === type)) {
      return recommendation;
    }
  }
  return null;
}

function hypothesisFromReasons(item: BusinessCaseHypothesis, label: string): string | null {
  const specific = item.reasons.find(
    (reason) => reason !== `Möglicher Business Case: ${label}`,
  );
  return specific ?? null;
}

function enrichSupportingSignals(
  titles: string[],
  opportunitySignals: OpportunitySignalRef[],
): BusinessCaseSignalView[] {
  return titles.map((title) => {
    const match = opportunitySignals.find((signal) => signal.title === title);
    return {
      title,
      type: match?.type ?? null,
      typeLabel: signalTypeLabel(match?.type ?? null),
      detectedAt: match?.detectedAt ? formatDate(match.detectedAt) : null,
    };
  });
}

function toView(
  item: BusinessCaseHypothesis,
  result: RecommendationResult,
  opportunitySignals: OpportunitySignalRef[],
): BusinessCaseView {
  const label = businessCaseLabel(item.type);
  const service = bestServiceForCase(result, item.type);
  const attached = service?.businessCases.find((entry) => entry.type === item.type);
  const valueProposition = attached?.valuePropositions[0] ?? null;

  return {
    type: item.type,
    label,
    hypothesis: hypothesisFromReasons(item, label),
    confidence: Number.isFinite(item.confidence) ? item.confidence : null,
    supportingSignals: enrichSupportingSignals(item.supportingSignals, opportunitySignals),
    valueProposition,
    serviceName: service?.service.name ?? null,
    serviceFit: service ? service.matchScore : null,
    conversationStarter: service?.conversationStarter ?? null,
  };
}

/**
 * Maps engine output to sales-facing copy. Does not infer new cases,
 * pick a winner among ties, or invent financial outcomes.
 */
export function toBusinessCasePresentation(
  result: RecommendationResult,
  opportunitySignals: OpportunitySignalRef[] = [],
): BusinessCasePresentation {
  const visible = selectVisibleBusinessCases(result);
  if (visible.length === 0) {
    return {
      heading: "Möglicher Business Case",
      cases: [],
      empty: true,
      emptyMessage: BUSINESS_CASE_EMPTY_MESSAGE,
    };
  }

  return {
    heading: visible.length === 1 ? "Möglicher Business Case" : "Mögliche Business Cases",
    cases: visible.map((item) => toView(item, result, opportunitySignals)),
    empty: false,
    emptyMessage: BUSINESS_CASE_EMPTY_MESSAGE,
  };
}
