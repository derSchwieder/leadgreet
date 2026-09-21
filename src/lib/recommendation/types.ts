import type { BusinessCaseType, CompanySize, ContactRole, SignalType } from "@/types";

export interface RecommendationService {
  id?: string;
  accountId?: string;
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

export interface RecommendationSignal {
  type: string;
  title: string;
  signalStrength: number;
}

export interface RecommendationOpportunity {
  company: {
    industry: string | null;
    companySize: string | null;
  };
  signals: RecommendationSignal[];
  recommendedContact: {
    role: string;
  } | null;
}

export interface BusinessCaseHypothesis {
  type: BusinessCaseType;
  confidence: number;
  reasons: string[];
  supportingSignals: string[];
  valuePropositions: string[];
}

export interface ServiceRecommendation {
  service: RecommendationService;
  matchScore: number;
  reasons: string[];
  matchedSignals: string[];
  conversationStarter: string | null;
  businessCases: BusinessCaseHypothesis[];
  primaryBusinessCase: BusinessCaseHypothesis | null;
}

export interface ServiceMatchBreakdown {
  matchScore: number;
  reasons: string[];
  matchedSignals: string[];
}

export interface RecommendationInput {
  opportunity: RecommendationOpportunity;
  services: RecommendationService[];
}

export interface RecommendationResult {
  primaryRecommendation: ServiceRecommendation | null;
  alternativeRecommendations: ServiceRecommendation[];
  recommendations: ServiceRecommendation[];
  businessCases: BusinessCaseHypothesis[];
  primaryBusinessCase: BusinessCaseHypothesis | null;
}
