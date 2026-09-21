import { BUSINESS_CASE_LABELS, SIGNAL_TYPE_LABELS } from "@/lib/labels";
import type { BusinessCaseType } from "@/types";

export const EMAIL_CLOSING = "Viele Grüße";

export const DEFAULT_CONVERSATION_ASK =
  "Wenn das aktuell ein Thema ist, würde ich mich gerne kurz dazu austauschen.";

export const SUBJECT_BY_BUSINESS_CASE: Record<BusinessCaseType, string> = {
  COST_REDUCTION: "Potenzial für effizientere Prozesse bei {company}",
  REVENUE_GROWTH: "Neue Wachstumspotenziale für {company}",
  CAPACITY: "Zusätzliche Kapazität für {company}",
  RISK_REDUCTION: "Potenzial zur Modernisierung bei {company}",
};

export const SIGNAL_SUBJECT_FALLBACK = "Ein aktuelles Signal bei {company}";

/** Observed signal types as a cautious occasion — not invented company facts. */
export const SIGNAL_OCCASION: Record<string, string> = {
  AI_PROJECT: "eine aktuelle KI-Initiative",
  AI_STRATEGY: "eine aktuelle KI-Strategie",
  AI_RECRUITING: "aktuelles KI-Recruiting",
  AI_AGENT: "Aktivitäten rund um KI-Agenten",
  GENAI: "eine Initiative zu generativer KI",
  CLOUD_MIGRATION: "eine laufende Cloud-Migration",
  DATA_PLATFORM: "eine Datenplattform-Initiative",
  DATA_ANALYTICS: "ein Vorhaben im Bereich Datenanalyse",
  ERP_TRANSFORMATION: "eine ERP-Transformation",
  SOFTWARE_MODERNIZATION: "eine Software-Modernisierung",
  PROCESS_AUTOMATION: "ein Vorhaben zur Prozessautomatisierung",
  DIGITAL_TRANSFORMATION: "ein Digitalisierungsvorhaben",
  IT_REORGANIZATION: "eine IT-Reorganisation",
  NEW_CIO: "eine neue CIO-Verantwortung",
  NEW_CTO: "eine neue CTO-Verantwortung",
  NEW_CDO: "eine neue CDO-Verantwortung",
  NEW_INNOVATION_LEAD: "eine neue Innovationsleitung",
  EXPANSION: "eine Expansion",
  INVESTMENT: "eine Investition",
  FUNDING: "eine Finanzierungsrunde",
  M_AND_A: "eine Fusion oder Übernahme",
  IT_RECRUITING: "aktuelle IT-Stellenausschreibungen",
};

export const BUSINESS_CASE_HYPOTHESIS: Record<BusinessCaseType, string> = {
  COST_REDUCTION:
    "Das könnte darauf hindeuten, dass sich manuelle Aufwände reduzieren ließen.",
  REVENUE_GROWTH:
    "Das könnte darauf hindeuten, dass hier neue Wachstumspotenziale liegen.",
  CAPACITY:
    "Das könnte darauf hindeuten, dass zusätzliche Entwicklungskapazität benötigt wird.",
  RISK_REDUCTION:
    "Das könnte darauf hindeuten, dass sich technische oder operative Risiken reduzieren ließen.",
};

export function companyInTemplate(template: string, companyName: string): string {
  return template.replaceAll("{company}", companyName);
}

export function businessCaseLabel(type: BusinessCaseType): string {
  return BUSINESS_CASE_LABELS[type] ?? type;
}

export function signalTypeLabel(type: string): string {
  return SIGNAL_TYPE_LABELS[type] ?? type;
}

export function signalOccasion(type: string): string {
  return SIGNAL_OCCASION[type] ?? `ein aktuelles Signal (${signalTypeLabel(type)})`;
}
