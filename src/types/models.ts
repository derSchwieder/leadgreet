import type {
  ActivityOutcome,
  ActivityType,
  BusinessCaseType,
  CompanySize,
  ContactRole,
  ContentType,
  CompanyScreeningStatus,
  CompanyScreeningTrigger,
  OpportunityStatus,
  SalesTodoStatus,
  SignalFeedbackReason,
  SignalStatus,
  SignalType,
  SourceType,
  UnresolvedSignalStatus,
} from "./enums";

export type {
  ActivityOutcome,
  ActivityType,
  BusinessCaseType,
  CompanyScreeningStatus,
  CompanyScreeningTrigger,
  CompanySize,
  ContactRole,
  ContentType,
  OpportunityStatus,
  SalesTodoStatus,
  SignalFeedbackReason,
  SignalStatus,
  SignalType,
  SourceType,
  UnresolvedSignalStatus,
};

export interface Account {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  accountId: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthOtp {
  id: string;
  email: string;
  userId: string | null;
  expiresAt: Date;
  consumedAt: Date | null;
  attempts: number;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface Company {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  industry: string | null;
  subIndustry: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  geocodedAt: Date | null;
  employees: number | null;
  revenue: string | null;
  revenueCurrency: string | null;
  revenueYear: number | null;
  companySize: CompanySize | null;
  ownership: string | null;
  description: string | null;
  isSeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Source {
  id: string;
  name: string;
  url: string | null;
  sourceType: SourceType;
  publishedAt: Date | null;
  accessedAt: Date | null;
  credibilityScore: number;
  isSeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Signal {
  id: string;
  companyId: string;
  type: SignalType;
  title: string;
  description: string | null;
  detectedAt: Date;
  eventDate: Date | null;
  sourceId: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  signalStrength: number;
  freshnessScore: number;
  relevanceScore: number;
  confidenceScore: number;
  status: SignalStatus;
  isSeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: ContactRole;
  department: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  sourceUrl: string | null;
  notes: string | null;
  confidenceScore: number;
  isDecisionMaker: boolean;
  isSeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Opportunity {
  id: string;
  accountId: string;
  companyId: string;
  title: string;
  description: string | null;
  recommendedApproach: string | null;
  whyNow: string | null;
  opportunityScore: number;
  signalStrength: number;
  companyFit: number;
  contactFit: number;
  freshness: number;
  confidence: number;
  status: OpportunityStatus;
  recommendedContactId: string | null;
  isSeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  accountId: string;
  name: string;
  description: string | null;
  targetIndustries: string[];
  targetCompanySizes: CompanySize[];
  targetRoles: ContactRole[];
  matchingSignalTypes: SignalType[];
  businessCaseTypes: BusinessCaseType[];
  valuePropositions: string[];
  conversationStarter: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentItem {
  id: string;
  accountId: string;
  name: string;
  description: string | null;
  type: ContentType;
  url: string | null;
  fileName: string | null;
  mimeType: string | null;
  tags: string[];
  businessCaseTypes: BusinessCaseType[];
  targetRoles: ContactRole[];
  targetCompanySizes: CompanySize[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  accountId: string;
  opportunityId: string;
  companyId: string;
  contactId: string | null;
  userId: string | null;
  type: ActivityType;
  subject: string | null;
  note: string | null;
  occurredAt: Date;
  outcome: ActivityOutcome | null;
  outcomeNote: string | null;
  responseToActivityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesTodo {
  id: string;
  accountId: string;
  opportunityId: string;
  companyId: string;
  contactId: string | null;
  title: string;
  dueAt: Date;
  status: SalesTodoStatus;
  completedAt: Date | null;
  relatedActivityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityStatusHistory {
  id: string;
  accountId: string;
  opportunityId: string;
  fromStatus: OpportunityStatus | null;
  toStatus: OpportunityStatus;
  userId: string | null;
  note: string | null;
  changedAt: Date;
}

export interface ScoreBreakdown {
  id: string;
  opportunityId: string;
  signalStrength: number;
  freshness: number;
  companyFit: number;
  contactFit: number;
  confidence: number;
  totalScore: number;
  explanation: string;
  createdAt: Date;
}

export interface ScoreFactor {
  code: string;
  label: string;
  points: number;
  detail: string;
}

export interface ComponentScore {
  score: number;
  factors: ScoreFactor[];
}

export interface SignalFeedback {
  id: string;
  signalId: string;
  companyId: string;
  accountId: string;
  userId: string;
  relevant: boolean;
  reason: SignalFeedbackReason | null;
  greetScore: number;
  signalStrength: number;
  freshness: number;
  companyFit: number;
  contactFit: number;
  confidence: number;
  serviceFit: number | null;
  businessCase: string | null;
  scoringWeights: {
    signalStrength: number;
    freshness: number;
    companyFit: number;
    contactFit: number;
    confidence: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UnresolvedSignal {
  id: string;
  source: string;
  sourceUrl: string | null;
  externalId: string | null;
  title: string;
  description: string | null;
  signalType: SignalType | null;
  detectedAt: Date;
  publishedAt: Date | null;
  rawPayload: unknown | null;
  companyNameRaw: string | null;
  personNameRaw: string | null;
  domainRaw: string | null;
  locationRaw: string | null;
  status: UnresolvedSignalStatus;
  confidence: number | null;
  resolvedCompanyId: string | null;
  resolvedContactId: string | null;
  resolvedSignalId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyScreening {
  id: string;
  accountId: string;
  companyId: string | null;
  inputName: string;
  inputDomain: string | null;
  status: CompanyScreeningStatus;
  triggeredBy: CompanyScreeningTrigger;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyScreeningResult {
  id: string;
  screeningId: string;
  payload: CompanyScreeningResultPayload;
  createdAt: Date;
  updatedAt: Date;
}

export type ScreeningStatementKind = "FACT" | "SIGNAL" | "INTERPRETATION";

export interface ScreeningSource {
  title: string;
  url: string | null;
  publisher: string | null;
  publishedAt: string | null;
}

export interface CompanyScreeningCompanyProfile {
  companyName?: string | null;
  domain?: string | null;
  description?: string | null;
  industry?: string | null;
  headquarters?: string | null;
  countries?: string[] | null;
  employeeCount?: number | null;
  revenue?: string | number | null;
  ownership?: string | null;
  companyType?: string | null;
  businessModel?: string | null;
  products?: string[] | null;
}

export interface CompanyScreeningIcpAssessment {
  overallFit?: boolean | number | string | null;
  industryFit?: boolean | number | string | null;
  sizeFit?: boolean | number | string | null;
  geographyFit?: boolean | number | string | null;
  strategicFit?: boolean | number | string | null;
  reasons?: string[];
  risks?: string[];
  mismatches?: string[];
}

export interface CompanyScreeningSignalRef {
  signalId?: string;
  unresolvedSignalId?: string;
  signalType?: SignalType | string | null;
  title?: string;
  description?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  date?: string | null;
  relevance?: number | string | null;
  kind?: ScreeningStatementKind;
}

export interface CompanyScreeningContactRef {
  name?: string;
  role?: string;
  source?: string | null;
  linkedinUrl?: string;
  sourceUrl?: string;
  relevance?: number | string;
}

export interface CompanyScreeningSalesHypotheses {
  painPoints?: string[];
  useCases?: string[];
  triggers?: string[];
  conversationStarters?: string[];
}

export interface ScreeningSalesHypothesis {
  hypothesis: string;
  evidence: string[];
  potentialNeed: string;
  relevance: number | string | null;
  kind: "INTERPRETATION";
}

export type WebResearchSourceKind = "official" | "news" | "jobs" | "other";

export interface ScreeningWebResearchResult {
  title: string;
  url: string;
  description?: string | null;
  publishedAt?: string | null;
  source?: string | null;
  sourceKind?: WebResearchSourceKind;
}

export interface ScreeningWebResearch {
  provider: string;
  queries: string[];
  results: ScreeningWebResearchResult[];
}

export interface ScreeningAnalysisEvidence {
  url: string;
  title?: string;
  publisher?: string;
  publishedAt?: string;
}

export interface ScreeningAnalysisStatement {
  kind: "fact" | "interpretation";
  statement: string;
  evidence: ScreeningAnalysisEvidence[];
}

export interface ScreeningAnalysisConflict {
  topic: string;
  values: Array<{
    value: string;
    source: string;
    publishedAt?: string;
  }>;
  status: "conflicting_evidence";
}

export interface ScreeningAnalysisResult {
  companyProfile: {
    summary: string;
    industry?: string;
    businessModel?: string;
    size?: string;
    revenue?: string;
    technologyProfile?: string;
    transformationProfile?: string;
    evidence: ScreeningAnalysisEvidence[];
  };
  facts?: ScreeningAnalysisStatement[];
  interpretations?: ScreeningAnalysisStatement[];
  icpAssessment: {
    criteria: Array<{
      criterion: "industry" | "geography" | "size" | "revenue";
      finding: string;
      status: "supported" | "not_supported" | "unknown";
      evidence: ScreeningAnalysisEvidence[];
    }>;
    summary: string;
    confidence: "low" | "medium" | "high";
    evidence: ScreeningAnalysisEvidence[];
  };
  signals: Array<{
    type: string;
    title: string;
    description: string;
    category: "technology" | "transformation" | "ai" | "cloud" | "hiring" | "strategy" | "other";
    strength: "low" | "medium" | "high";
    evidence: ScreeningAnalysisEvidence[];
  }>;
  salesHypotheses: Array<{
    title: string;
    hypothesis: string;
    rationale: string;
    relevance: "low" | "medium" | "high";
    evidence: ScreeningAnalysisEvidence[];
  }>;
  relevantContacts?: Array<{
    name: string;
    role: string;
    company: string;
    profileUrl?: string;
    evidence: ScreeningAnalysisEvidence[];
    relevance: "low" | "medium" | "high";
    relevanceReason: string;
    relatedSignals: string[];
  }>;
  conflicts?: ScreeningAnalysisConflict[];
  limitations: string[];
}

export interface CompanyScreeningResultPayload {
  companyProfile?: CompanyScreeningCompanyProfile;
  icpAssessment?: CompanyScreeningIcpAssessment;
  signals?: CompanyScreeningSignalRef[];
  contacts?: CompanyScreeningContactRef[];
  salesHypotheses?: CompanyScreeningSalesHypotheses | ScreeningSalesHypothesis[];
  sources?: ScreeningSource[];
  research?: ScreeningWebResearch;
  contactResearch?: {
    provider?: string;
    queries: string[];
    results: ScreeningWebResearchResult[];
    candidates: Array<{
      name: string;
      role: string;
      company: string;
      profileUrl?: string;
      sourceUrl: string;
      sourceTitle?: string;
      sourcePublisher?: string;
      evidence: ScreeningAnalysisEvidence[];
      relevance: "low" | "medium" | "high";
      relevanceReason: string;
      relatedSignals: string[];
    }>;
    limitations?: string[];
  };
  analysis?: ScreeningAnalysisResult;
  coverage?: "local_catalog" | "web" | "mixed";
  limitations?: string[];
  error?: { code: string; message: string };
}
