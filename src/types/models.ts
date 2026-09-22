import type {
  ActivityOutcome,
  ActivityType,
  BusinessCaseType,
  CompanySize,
  ContactRole,
  ContentType,
  OpportunityStatus,
  SalesTodoStatus,
  SignalFeedbackReason,
  SignalStatus,
  SignalType,
  SourceType,
} from "./enums";

export type {
  ActivityOutcome,
  ActivityType,
  BusinessCaseType,
  CompanySize,
  ContactRole,
  ContentType,
  OpportunityStatus,
  SalesTodoStatus,
  SignalFeedbackReason,
  SignalStatus,
  SignalType,
  SourceType,
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
