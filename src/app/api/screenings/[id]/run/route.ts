import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { runQueuedCompanyScreening } from "@/lib/screening";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const screening = await runQueuedCompanyScreening(accountId, id);
    return json({ screening });
  } catch (error) {
    return errorResponse(error);
  }
}
