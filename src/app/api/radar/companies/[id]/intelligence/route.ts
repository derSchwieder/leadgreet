import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getCompanyIntelligence } from "@/lib/db/intelligence";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const intelligence = await getCompanyIntelligence(id, accountId);
    const { accountId: _omittedAccountId, ...preview } = intelligence;
    void _omittedAccountId;
    return json({ intelligence: preview });
  } catch (error) {
    return errorResponse(error);
  }
}
