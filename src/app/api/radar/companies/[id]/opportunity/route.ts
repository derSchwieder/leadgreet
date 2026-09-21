import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getCompanyById } from "@/lib/db/companies";
import {
  findActiveOpportunityByCompany,
  findOrCreateOpportunityForCompany,
} from "@/lib/db/opportunities";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id: companyId } = await context.params;
    const accountId = await getCurrentAccountId();
    await getCompanyById(companyId);
    const existing = await findActiveOpportunityByCompany(accountId, companyId);
    return json({ opportunityId: existing?.id ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id: companyId } = await context.params;
    const accountId = await getCurrentAccountId();
    const result = await findOrCreateOpportunityForCompany(accountId, companyId);
    return json({
      opportunityId: result.opportunityId,
      created: result.created,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
