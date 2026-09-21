import { opportunityDetailPath } from "@/lib/opportunities/path";

export function radarOpportunityPath(opportunityId: string): string {
  return opportunityDetailPath(opportunityId);
}

export function radarOpportunityCtaLabel(opportunityId: string | null): string {
  return opportunityId ? "Opportunity öffnen" : "Opportunity anlegen";
}

export async function resolveRadarOpportunity(
  companyId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ opportunityId: string; created: boolean }> {
  const response = await fetchImpl(`/api/radar/companies/${companyId}/opportunity`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("resolve-failed");
  }
  const body = (await response.json()) as { opportunityId?: string; created?: boolean };
  if (!body.opportunityId) {
    throw new Error("resolve-failed");
  }
  return { opportunityId: body.opportunityId, created: Boolean(body.created) };
}
