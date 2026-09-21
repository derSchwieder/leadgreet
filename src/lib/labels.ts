export const SIGNAL_TYPE_LABELS: Record<string, string> = {
  AI_PROJECT: "KI-Projekt",
  AI_STRATEGY: "KI-Strategie",
  AI_RECRUITING: "KI-Recruiting",
  AI_AGENT: "KI-Agent",
  GENAI: "Generative KI",
  CLOUD_MIGRATION: "Cloud-Migration",
  DATA_PLATFORM: "Datenplattform",
  DATA_ANALYTICS: "Datenanalyse",
  ERP_TRANSFORMATION: "ERP-Transformation",
  SOFTWARE_MODERNIZATION: "Software-Modernisierung",
  PROCESS_AUTOMATION: "Prozessautomatisierung",
  DIGITAL_TRANSFORMATION: "Digitale Transformation",
  IT_REORGANIZATION: "IT-Reorganisation",
  NEW_CIO: "Neue CIO-Position",
  NEW_CTO: "Neue CTO-Position",
  NEW_CDO: "Neue CDO-Position",
  NEW_INNOVATION_LEAD: "Neue Innovationsleitung",
  EXPANSION: "Expansion",
  INVESTMENT: "Investition",
  FUNDING: "Finanzierung",
  M_AND_A: "Fusion & Übernahme",
  IT_RECRUITING: "IT-Recruiting",
  OTHER: "Sonstiges",
};

export const SIGNAL_CATEGORY_LABELS_DE: Record<string, string> = {
  AI: "KI",
  CLOUD: "Cloud",
  DATA: "Daten",
  AUTOMATION: "Automatisierung",
  IT_TRANSFORMATION: "IT-Transformation",
  LEADERSHIP: "Führung",
  INVESTMENT: "Investition",
  OTHER: "Sonstiges",
};

export const CONTACT_ROLE_LABELS: Record<string, string> = {
  CEO: "CEO",
  MANAGING_DIRECTOR: "Geschäftsführung",
  CIO: "CIO",
  CTO: "CTO",
  CDO: "CDO",
  HEAD_OF_IT: "IT-Leitung",
  HEAD_OF_DIGITALIZATION: "Leitung Digitalisierung",
  HEAD_OF_INNOVATION: "Innovationsleitung",
  HEAD_OF_DATA: "Datenleitung",
  HEAD_OF_AI: "KI-Leitung",
  HEAD_OF_TRANSFORMATION: "Transformationsleitung",
  HEAD_OF_SOFTWARE: "Software-Leitung",
  COO: "COO",
  OTHER: "Sonstiges",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  COMPANY_WEBSITE: "Unternehmenswebsite",
  PRESS_RELEASE: "Pressemitteilung",
  NEWS: "Nachrichten",
  JOB_POSTING: "Stellenanzeige",
  ANNUAL_REPORT: "Geschäftsbericht",
  FUNDING: "Finanzierung",
  PUBLIC_TENDER: "Öffentliche Ausschreibung",
  OTHER: "Sonstiges",
};

export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  NEW: "Neu",
  REVIEWED: "Geprüft",
  QUALIFIED: "Qualifiziert",
  CONTACTED: "Kontaktiert",
  MEETING: "Termin vereinbart",
  OPPORTUNITY: "Opportunity",
  WON: "Gewonnen",
  LOST: "Verloren",
  DISMISSED: "Verworfen",
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  EMAIL_SENT: "E-Mail gesendet",
  EMAIL_RECEIVED: "E-Mail erhalten",
  CALL: "Anruf",
  MEETING: "Termin",
  NOTE: "Notiz",
  FOLLOW_UP: "Follow-up",
  STATUS_CHANGE: "Statusänderung",
  OTHER: "Sonstiges",
};

export const ACTIVITY_OUTCOME_LABELS: Record<string, string> = {
  NO_RESPONSE: "Keine Reaktion",
  RESPONSE_RECEIVED: "Antwort erhalten",
  CALLBACK_RECEIVED: "Rückruf erhalten",
  INTERESTED: "Interesse",
  NOT_INTERESTED: "Kein Interesse",
  MEETING_AGREED: "Termin vereinbart",
  FOLLOW_UP_LATER: "Später wieder melden",
  NOT_REACHABLE: "Nicht erreicht",
  OTHER: "Sonstiges",
};

export const DOCUMENTABLE_ACTIVITY_TYPES = [
  "EMAIL_SENT",
  "EMAIL_RECEIVED",
  "CALL",
  "MEETING",
  "NOTE",
  "FOLLOW_UP",
  "OTHER",
] as const;

export function activityTypeLabel(value: string): string {
  return ACTIVITY_TYPE_LABELS[value] ?? value;
}

export function activityOutcomeLabel(value: string): string {
  return ACTIVITY_OUTCOME_LABELS[value] ?? value;
}

export function opportunityStatusLabel(value: string): string {
  return OPPORTUNITY_STATUS_LABELS[value] ?? value;
}

export const SALES_TODO_STATUS_LABELS: Record<string, string> = {
  OPEN: "Offen",
  DONE: "Erledigt",
};

export function salesTodoStatusLabel(value: string): string {
  return SALES_TODO_STATUS_LABELS[value] ?? value;
}

export const SIGNAL_STATUS_LABELS: Record<string, string> = {
  NEW: "Neu",
  REVIEWED: "Geprüft",
  DISMISSED: "Verworfen",
};

export const BUSINESS_CASE_LABELS: Record<string, string> = {
  COST_REDUCTION: "Kosten senken",
  REVENUE_GROWTH: "Umsatz steigern",
  CAPACITY: "Kapazität schaffen",
  RISK_REDUCTION: "Risiko reduzieren",
};

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  PRESENTATION: "Präsentation",
  ONE_PAGER: "One-Pager",
  CASE_STUDY: "Fallstudie",
  WHITEPAPER: "Whitepaper",
  REFERENCE: "Referenz",
  PRODUCT_DOCUMENT: "Produktdokument",
  OTHER: "Sonstiges",
};

export const COMPANY_SIZE_LABELS: Record<string, string> = {
  STARTUP: "Startup",
  SMALL: "Klein",
  MEDIUM: "Mittel",
  LARGE: "Groß",
  ENTERPRISE: "Konzern",
};

export const SCORING_DIMENSION_LABELS: Record<string, string> = {
  signalStrength: "Signalstärke",
  freshness: "Aktualität",
  companyFit: "Unternehmens-Fit",
  contactFit: "Kontakt-Fit",
  confidence: "Sicherheit",
};

export const INVENTORY_LABELS: Record<string, string> = {
  companies: "Unternehmen",
  signals: "Signale",
  contacts: "Kontakte",
  opportunities: "Chancen",
  sources: "Quellen",
};

export const INDUSTRY_LABELS: Record<string, string> = {
  automotive: "Automotive",
  manufacturing: "Fertigung",
  industrial: "Industrie",
  logistics: "Logistik",
  electronics: "Elektronik",
  engineering: "Ingenieurwesen",
  machinery: "Maschinenbau",
  mobility: "Mobilität",
};

export const COUNTRY_LABELS: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
  Germany: "Deutschland",
  Austria: "Österreich",
  Switzerland: "Schweiz",
  Deutschland: "Deutschland",
  Österreich: "Österreich",
  Schweiz: "Schweiz",
};

const ENUM_LABELS: Record<string, string> = {
  ...SIGNAL_TYPE_LABELS,
  ...CONTACT_ROLE_LABELS,
  ...SOURCE_TYPE_LABELS,
  ...OPPORTUNITY_STATUS_LABELS,
  ...COMPANY_SIZE_LABELS,
  ...BUSINESS_CASE_LABELS,
  ...CONTENT_TYPE_LABELS,
};

export function translateEnum(value: string): string {
  return (
    ENUM_LABELS[value] ??
    value
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function translateIndustry(value: string): string {
  return INDUSTRY_LABELS[value] ?? INDUSTRY_LABELS[value.toLowerCase()] ?? value;
}

export function translateCountry(value: string): string {
  return COUNTRY_LABELS[value] ?? value;
}
