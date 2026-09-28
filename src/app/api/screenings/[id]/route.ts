import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getCompanyScreeningById } from "@/lib/db/screenings";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const screening = await getCompanyScreeningById(accountId, id);
    return json({ screening });
  } catch (error) {
    return errorResponse(error);
  }
}
