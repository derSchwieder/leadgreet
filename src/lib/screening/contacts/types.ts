import type { ScreeningAnalysisEvidence, ScreeningWebResearchResult } from "@/types";
import type { NormalizedScreeningInput } from "../normalize";

export const CONTACT_RESEARCH_FAILED = "CONTACT_RESEARCH_FAILED";
export const NO_CONTACTS_NOTE = "Keine ausreichend belegten relevanten Ansprechpartner gefunden.";
export const PUBLIC_CONTACTS_NOTE =
  "Es wurden nur öffentlich zugängliche berufliche Informationen berücksichtigt.";

export type ContactResearchRelevance = "low" | "medium" | "high";

export type ContactResearchCandidate = {
  name: string;
  role: string;
  company: string;
  profileUrl?: string;
  sourceUrl: string;
  sourceTitle?: string;
  sourcePublisher?: string;
  /** Stage-A pattern id when deterministically known (e.g. ROLE_THEN_NAME). */
  extractionPattern?: string;
  evidence: ScreeningAnalysisEvidence[];
  relevance: ContactResearchRelevance;
  relevanceReason: string;
  relatedSignals: string[];
};

export type ContactResearchInput = NormalizedScreeningInput & {
  themes?: string[];
};

export type ContactResearchFinding = {
  available: boolean;
  provider?: string;
  queries: string[];
  results: ScreeningWebResearchResult[];
  candidates: ContactResearchCandidate[];
  limitations: string[];
  errorCode?: string;
};

export type ContactSearchFn = (query: string) => Promise<ScreeningWebResearchResult[]>;
