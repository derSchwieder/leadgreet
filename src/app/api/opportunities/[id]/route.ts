import { getOpportunityById } from "@/lib/db/opportunities";
import { getCRMClient } from "@/lib/crm";
import { errorResponse, json, requireDatabase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const opportunity = await getOpportunityById(id);
    return json({ opportunity });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * UI-facing CRM export. Uses the CRM port (stub in this sprint).
 * Does not call MOCO or any other provider.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const opportunity = await getOpportunityById(id);
    const crm = getCRMClient();
    const result = await crm.addOpportunity({
      opportunityId: opportunity.id,
      companyName: opportunity.company.name,
      title: opportunity.title,
      description: opportunity.description,
      whyNow: opportunity.whyNow,
      recommendedApproach: opportunity.recommendedApproach,
      opportunityScore: opportunity.opportunityScore,
      contactName: opportunity.recommendedContact?.fullName ?? null,
      contactRole: opportunity.recommendedContact?.role ?? null,
      contactEmail: null,
    });
    return json({ result });
  } catch (error) {
    return errorResponse(error);
  }
}
