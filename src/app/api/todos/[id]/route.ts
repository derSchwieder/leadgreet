import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { completeSalesTodo } from "@/lib/db/todos";
import { completeSalesTodoSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    completeSalesTodoSchema.parse(await request.json());
    const accountId = await getCurrentAccountId();
    const todo = await completeSalesTodo(accountId, id);
    return json({ todo });
  } catch (error) {
    return errorResponse(error);
  }
}
