import type { CRMClient, CRMOpportunityPayload, CRMWriteResult } from "./types";

/**
 * Default adapter for this sprint. Does not call any external CRM.
 * Replace via getCRMClient() once a real provider is configured.
 */
export class StubCRMClient implements CRMClient {
  readonly provider = "stub" as const;
  readonly configured = false;

  async addOpportunity(payload: CRMOpportunityPayload): Promise<CRMWriteResult> {
    return {
      ok: false,
      provider: this.provider,
      externalId: null,
      message: `CRM is not connected. Opportunity “${payload.title}” was not exported. Configure a CRM adapter (Moco, HubSpot, or other) to enable this action.`,
    };
  }
}
