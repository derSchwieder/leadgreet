import { StubCRMClient } from "./stub";
import type { CRMClient } from "./types";

let instance: CRMClient | null = null;

/**
 * Resolve the active CRM adapter.
 * Later: switch on CRM_PROVIDER env (moco | hubspot | other).
 * This sprint always returns the stub so the app never imports MOCO.
 */
export function getCRMClient(): CRMClient {
  if (!instance) {
    instance = new StubCRMClient();
  }
  return instance;
}

export type { CRMClient, CRMOpportunityPayload, CRMWriteResult, CRMProvider } from "./types";
export { StubCRMClient } from "./stub";
