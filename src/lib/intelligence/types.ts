import type { ActivityOutcome, ActivityType, BusinessCaseType, CompanySize, ContactRole, ContentType, SignalType } from "@/types";
import type { BusinessCaseHypothesis, ServiceRecommendation } from "@/lib/recommendation";

export type IntelligenceNextStep =
  | "PREPARE_OUTREACH"
  | "SEND_CONTENT"
  | "CONTACT_EXISTING"
  | "CHECK_FOLLOW_UP";

export const NEXT_STEP_LABELS: Record<IntelligenceNextStep, string> = {
  PREPARE_OUTREACH: "Kontaktaufnahme vorbereiten",
  SEND_CONTENT: "Passenden Inhalt senden",
  CONTACT_EXISTING: "Bestehenden Kontakt ansprechen",
  CHECK_FOLLOW_UP: "Follow-up prüfen",
};

export interface IntelligenceSignal {
  id: string;
  type: SignalType | string;
  title: string;
  signalStrength: number;
  detectedAt: Date;
}

export interface IntelligenceCompany {
  id: string;
  name: string;
  industry: string | null;
  companySize: CompanySize | string | null;
}

export interface IntelligenceContact {
  id: string;
  fullName: string;
  role: ContactRole | string;
  isDecisionMaker: boolean;
  email: string | null;
}

export interface IntelligenceContentService {
  id: string;
  name: string;
}

export interface IntelligenceContentItem {
  id: string;
  name: string;
  type: ContentType | string;
  url: string | null;
  isActive: boolean;
  businessCaseTypes: Array<BusinessCaseType | string>;
  targetRoles: Array<ContactRole | string>;
  targetCompanySizes: Array<CompanySize | string>;
  services: IntelligenceContentService[];
}

export interface IntelligenceActivity {
  id: string;
  type: ActivityType | string;
  subject: string | null;
  occurredAt: Date;
  outcome: ActivityOutcome | string | null;
  accountId: string;
}

export interface IntelligenceServiceInput {
  id: string;
  accountId: string;
  name: string;
  description?: string | null;
  targetIndustries: string[];
  targetCompanySizes: Array<CompanySize | string>;
  targetRoles: Array<ContactRole | string>;
  matchingSignalTypes: Array<SignalType | string>;
  businessCaseTypes?: Array<BusinessCaseType | string>;
  valuePropositions?: string[];
  conversationStarter: string | null;
  isActive: boolean;
}

export interface CompanyIntelligenceInput {
  accountId: string;
  company: IntelligenceCompany;
  signals: IntelligenceSignal[];
  services: IntelligenceServiceInput[];
  contentItems: IntelligenceContentItem[];
  contacts: IntelligenceContact[];
  activities: IntelligenceActivity[];
}

export interface IntelligenceContentMatch {
  item: IntelligenceContentItem;
  score: number;
}

export interface CompanyIntelligence {
  accountId: string;
  company: IntelligenceCompany;
  triggerSignal: IntelligenceSignal | null;
  primaryService: ServiceRecommendation | null;
  businessCases: BusinessCaseHypothesis[];
  primaryBusinessCase: BusinessCaseHypothesis | null;
  matchingContact: IntelligenceContact | null;
  recommendedContent: IntelligenceContentMatch | null;
  recentActivities: IntelligenceActivity[];
  nextStep: IntelligenceNextStep;
  nextStepReason: string;
}
