import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getOpportunityById, updateOpportunityStatus } from "@/lib/db/opportunities";
import { listStatusHistory } from "@/lib/db/opportunity-status-history";
import { updateOpportunityStatusSchema } from "@/lib/validation";
import type { OpportunityStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const opportunity = await getOpportunityById(id, accountId);
    const history = await listStatusHistory(accountId, id);
    return json({ status: opportunity.status, history });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const body: unknown = await request.json();
    const input = updateOpportunityStatusSchema.parse(body);
    const accountId = await getCurrentAccountId();
    const opportunity = await updateOpportunityStatus(
      accountId,
      id,
      input.toStatus as OpportunityStatus,
      input.note,
    );
    const history = await listStatusHistory(accountId, id);
    return json({ opportunity, history });
  } catch (error) {
    return errorResponse(error);
  }
}
