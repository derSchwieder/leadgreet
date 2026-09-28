import type { IcpProfile } from "@/lib/icp";
import type { ContactResearchCandidate } from "@/lib/screening/contacts/types";
import type { ScreeningWebResearchResult } from "@/types";

export type EvidenceReference = {
  url: string;
  title?: string;
  publisher?: string;
  publishedAt?: string;
};

export type AnalysisClaimKind = "fact" | "interpretation" | "sales_hypothesis";

export type ScreeningAnalysisStatement = {
  kind: "fact" | "interpretation";
  statement: string;
  evidence: EvidenceReference[];
};

export type ScreeningEvidenceConflictValue = {
  value: string;
  source: string;
  publishedAt?: string;
};

export type ScreeningEvidenceConflict = {
  topic: string;
  values: ScreeningEvidenceConflictValue[];
  status: "conflicting_evidence";
};

export type ScreeningAnalysisConfidence = "low" | "medium" | "high";

export type IcpCriterionName = "industry" | "geography" | "size" | "revenue";

export type IcpCriterionAssessment = {
  criterion: IcpCriterionName;
  finding: string;
  status: "supported" | "not_supported" | "unknown";
  evidence: EvidenceReference[];
};

export type ScreeningSignalCategory =
  | "technology"
  | "transformation"
  | "ai"
  | "cloud"
  | "hiring"
  | "strategy"
  | "other";

export type ScreeningAnalysisSignal = {
  type: string;
  title: string;
  description: string;
  category: ScreeningSignalCategory;
  strength: ScreeningAnalysisConfidence;
  evidence: EvidenceReference[];
};

export type ScreeningAnalysisHypothesis = {
  title: string;
  hypothesis: string;
  rationale: string;
  relevance: ScreeningAnalysisConfidence;
  evidence: EvidenceReference[];
};

export type ScreeningRelevantContact = {
  name: string;
  role: string;
  company: string;
  profileUrl?: string;
  evidence: EvidenceReference[];
  relevance: ScreeningAnalysisConfidence;
  relevanceReason: string;
  relatedSignals: string[];
};

export type ScreeningAnalysis = {
  companyProfile: {
    summary: string;
    industry?: string;
    businessModel?: string;
    size?: string;
    revenue?: string;
    technologyProfile?: string;
    transformationProfile?: string;
    evidence: EvidenceReference[];
  };
  facts: ScreeningAnalysisStatement[];
  interpretations: ScreeningAnalysisStatement[];
  icpAssessment: {
    criteria: IcpCriterionAssessment[];
    summary: string;
    confidence: ScreeningAnalysisConfidence;
    evidence: EvidenceReference[];
  };
  signals: ScreeningAnalysisSignal[];
  salesHypotheses: ScreeningAnalysisHypothesis[];
  relevantContacts: ScreeningRelevantContact[];
  conflicts: ScreeningEvidenceConflict[];
  limitations: string[];
};

export type ScreeningAnalysisInput = {
  company: {
    id?: string;
    name: string;
    domain?: string;
  };
  research: {
    queries: string[];
    results: ScreeningWebResearchResult[];
  };
  contacts?: {
    queries: string[];
    results: ScreeningWebResearchResult[];
    candidates: ContactResearchCandidate[];
  };
  icp?: IcpProfile | null;
};

export interface AnalysisPort {
  readonly available: boolean;
  readonly provider?: string;
  readonly unavailableCode?: string;
  analyze(input: ScreeningAnalysisInput): Promise<ScreeningAnalysis>;
}
