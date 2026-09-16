export type SignalType =
  | "AI_PROJECT"
  | "AI_STRATEGY"
  | "AI_RECRUITING"
  | "AI_AGENT"
  | "GENAI"
  | "CLOUD_MIGRATION"
  | "DATA_PLATFORM"
  | "DATA_ANALYTICS"
  | "ERP_TRANSFORMATION"
  | "SOFTWARE_MODERNIZATION"
  | "PROCESS_AUTOMATION"
  | "DIGITAL_TRANSFORMATION"
  | "IT_REORGANIZATION"
  | "NEW_CIO"
  | "NEW_CTO"
  | "NEW_CDO"
  | "NEW_INNOVATION_LEAD"
  | "EXPANSION"
  | "INVESTMENT"
  | "FUNDING"
  | "M_AND_A"
  | "IT_RECRUITING"
  | "OTHER";

export const SIGNAL_TYPES: readonly SignalType[] = [
  "AI_PROJECT",
  "AI_STRATEGY",
  "AI_RECRUITING",
  "AI_AGENT",
  "GENAI",
  "CLOUD_MIGRATION",
  "DATA_PLATFORM",
  "DATA_ANALYTICS",
  "ERP_TRANSFORMATION",
  "SOFTWARE_MODERNIZATION",
  "PROCESS_AUTOMATION",
  "DIGITAL_TRANSFORMATION",
  "IT_REORGANIZATION",
  "NEW_CIO",
  "NEW_CTO",
  "NEW_CDO",
  "NEW_INNOVATION_LEAD",
  "EXPANSION",
  "INVESTMENT",
  "FUNDING",
  "M_AND_A",
  "IT_RECRUITING",
  "OTHER",
] as const;

export type ContactRole =
  | "CEO"
  | "MANAGING_DIRECTOR"
  | "CIO"
  | "CTO"
  | "CDO"
  | "HEAD_OF_IT"
  | "HEAD_OF_DIGITALIZATION"
  | "HEAD_OF_INNOVATION"
  | "HEAD_OF_DATA"
  | "HEAD_OF_AI"
  | "HEAD_OF_TRANSFORMATION"
  | "HEAD_OF_SOFTWARE"
  | "COO"
  | "OTHER";

export const CONTACT_ROLES: readonly ContactRole[] = [
  "CEO",
  "MANAGING_DIRECTOR",
  "CIO",
  "CTO",
  "CDO",
  "HEAD_OF_IT",
  "HEAD_OF_DIGITALIZATION",
  "HEAD_OF_INNOVATION",
  "HEAD_OF_DATA",
  "HEAD_OF_AI",
  "HEAD_OF_TRANSFORMATION",
  "HEAD_OF_SOFTWARE",
  "COO",
  "OTHER",
] as const;

export type SourceType =
  | "COMPANY_WEBSITE"
  | "PRESS_RELEASE"
  | "NEWS"
  | "JOB_POSTING"
  | "ANNUAL_REPORT"
  | "FUNDING"
  | "PUBLIC_TENDER"
  | "OTHER";

export const SOURCE_TYPES: readonly SourceType[] = [
  "COMPANY_WEBSITE",
  "PRESS_RELEASE",
  "NEWS",
  "JOB_POSTING",
  "ANNUAL_REPORT",
  "FUNDING",
  "PUBLIC_TENDER",
  "OTHER",
] as const;

export type OpportunityStatus =
  | "NEW"
  | "REVIEWED"
  | "QUALIFIED"
  | "CONTACTED"
  | "MEETING"
  | "OPPORTUNITY"
  | "WON"
  | "LOST"
  | "DISMISSED";

export const OPPORTUNITY_STATUSES: readonly OpportunityStatus[] = [
  "NEW",
  "REVIEWED",
  "QUALIFIED",
  "CONTACTED",
  "MEETING",
  "OPPORTUNITY",
  "WON",
  "LOST",
  "DISMISSED",
] as const;

export type SignalStatus = "NEW" | "REVIEWED" | "DISMISSED";

export const SIGNAL_STATUSES: readonly SignalStatus[] = [
  "NEW",
  "REVIEWED",
  "DISMISSED",
] as const;

export type CompanySize = "STARTUP" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE";

export const COMPANY_SIZES: readonly CompanySize[] = [
  "STARTUP",
  "SMALL",
  "MEDIUM",
  "LARGE",
  "ENTERPRISE",
] as const;

export type SignalCategory =
  | "AI"
  | "CLOUD"
  | "DATA"
  | "AUTOMATION"
  | "IT_TRANSFORMATION"
  | "LEADERSHIP"
  | "INVESTMENT"
  | "OTHER";

export const SIGNAL_TYPE_CATEGORY: Record<SignalType, SignalCategory> = {
  AI_PROJECT: "AI",
  AI_STRATEGY: "AI",
  AI_RECRUITING: "AI",
  AI_AGENT: "AI",
  GENAI: "AI",
  CLOUD_MIGRATION: "CLOUD",
  DATA_PLATFORM: "DATA",
  DATA_ANALYTICS: "DATA",
  ERP_TRANSFORMATION: "AUTOMATION",
  SOFTWARE_MODERNIZATION: "AUTOMATION",
  PROCESS_AUTOMATION: "AUTOMATION",
  DIGITAL_TRANSFORMATION: "IT_TRANSFORMATION",
  IT_REORGANIZATION: "IT_TRANSFORMATION",
  IT_RECRUITING: "IT_TRANSFORMATION",
  NEW_CIO: "LEADERSHIP",
  NEW_CTO: "LEADERSHIP",
  NEW_CDO: "LEADERSHIP",
  NEW_INNOVATION_LEAD: "LEADERSHIP",
  EXPANSION: "INVESTMENT",
  INVESTMENT: "INVESTMENT",
  FUNDING: "INVESTMENT",
  M_AND_A: "INVESTMENT",
  OTHER: "OTHER",
};

export const SIGNAL_CATEGORY_LABELS: Record<SignalCategory, string> = {
  AI: "AI",
  CLOUD: "Cloud",
  DATA: "Data",
  AUTOMATION: "Automation",
  IT_TRANSFORMATION: "IT Transformation",
  LEADERSHIP: "Leadership",
  INVESTMENT: "Investment",
  OTHER: "Other",
};

export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
