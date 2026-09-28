import type { IcpProfile } from "@/lib/icp";
import type {
  CompanyScreeningCompanyProfile,
  CompanyScreeningIcpAssessment,
  CompanyScreeningResultPayload,
  CompanyScreeningSignalRef,
  ScreeningSalesHypothesis,
  ScreeningSource,
  ScreeningWebResearch,
} from "@/types";
import type { ContactResearchFinding, ContactResearchInput } from "../contacts/types";
import type { NormalizedScreeningInput } from "../normalize";

export type LocalCatalogCompany = {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  employees: number | null;
  revenue: string | null;
  ownership: string | null;
  description: string | null;
};

export type LocalCatalogSignal = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  detectedAt: Date;
  sourceName: string | null;
  sourceUrl: string | null;
};

export type CompanyResearchFinding = {
  profile: CompanyScreeningCompanyProfile;
  sources: ScreeningSource[];
  companyId: string | null;
  available: boolean;
  research?: ScreeningWebResearch;
};

export type SignalResearchFinding = {
  signals: CompanyScreeningSignalRef[];
  sources: ScreeningSource[];
};

export interface CompanyCatalogPort {
  findByNameOrDomain(input: NormalizedScreeningInput): Promise<LocalCatalogCompany | null>;
  listSignals(companyId: string): Promise<LocalCatalogSignal[]>;
}

export interface WebResearchPort {
  readonly available: boolean;
  readonly provider?: string;
  readonly unavailableCode?: string;
  researchCompany(input: NormalizedScreeningInput): Promise<CompanyResearchFinding>;
  researchSignals(input: NormalizedScreeningInput): Promise<SignalResearchFinding>;
  researchContacts(input: ContactResearchInput): Promise<ContactResearchFinding>;
}

export interface IcpSourcePort {
  getProfile(accountId: string): Promise<IcpProfile>;
}

export interface SalesIntelligencePort {
  readonly available: boolean;
  analyze(input: {
    profile: CompanyScreeningCompanyProfile;
    signals: CompanyScreeningSignalRef[];
  }): Promise<ScreeningSalesHypothesis[]>;
}

export type ScreeningRunInput = {
  accountId: string;
  screeningId: string;
  name: string;
  domain?: string | null;
};

export type ScreeningRunSuccess = {
  status: "COMPLETED";
  companyId: string | null;
  payload: CompanyScreeningResultPayload;
};

export type ScreeningRunFailure = {
  status: "FAILED";
  code: string;
  message: string;
};

export type ScreeningRunOutcome = ScreeningRunSuccess | ScreeningRunFailure;

export const WEB_RESEARCH_UNAVAILABLE = "WEB_RESEARCH_UNAVAILABLE";
export const WEB_RESEARCH_PROVIDER_ERROR = "WEB_RESEARCH_PROVIDER_ERROR";
export const WEB_RESEARCH_NO_RESULTS = "WEB_RESEARCH_NO_RESULTS";
export const BRAVE_API_KEY_MISSING = "BRAVE_API_KEY_MISSING";
export const TAVILY_API_KEY_MISSING = "TAVILY_API_KEY_MISSING";
export const LLM_UNAVAILABLE = "LLM_UNAVAILABLE";
export const COMPANY_NOT_FOUND = "COMPANY_NOT_FOUND";

export class WebResearchError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "WebResearchError";
    this.code = code;
  }
}
