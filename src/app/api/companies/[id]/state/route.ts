import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { setAccountCompanyState } from "@/lib/db/account-company-state";
import { accountCompanyStateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id: companyId } = await context.params;
    const accountId = await getCurrentAccountId();
    const body: unknown = await request.json();
    const input = accountCompanyStateSchema.parse(body);
    const state = await setAccountCompanyState(accountId, companyId, input.status, input.note);
    return json({ state });
  } catch (error) {
    return errorResponse(error);
  }
}
