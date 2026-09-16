export type CRMProvider = "stub" | "moco" | "hubspot" | "other";

export interface CRMOpportunityPayload {
  opportunityId: string;
  companyName: string;
  title: string;
  description: string | null;
  whyNow: string | null;
  recommendedApproach: string | null;
  opportunityScore: number;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
}

export interface CRMWriteResult {
  ok: boolean;
  provider: CRMProvider;
  externalId: string | null;
  message: string;
}

/**
 * CRM port. Application code depends on this interface only.
 * Concrete adapters (Moco, HubSpot, …) must be added later without
 * changing callers.
 */
export interface CRMClient {
  readonly provider: CRMProvider;
  readonly configured: boolean;
  addOpportunity(payload: CRMOpportunityPayload): Promise<CRMWriteResult>;
}
