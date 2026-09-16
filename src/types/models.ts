import type {
  CompanySize,
  ContactRole,
  OpportunityStatus,
  SignalStatus,
  SignalType,
  SourceType,
} from "./enums";

export type { CompanySize, ContactRole, OpportunityStatus, SignalStatus, SignalType, SourceType };

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
  confidenceScore: number;
  isDecisionMaker: boolean;
  isSeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Opportunity {
  id: string;
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
