import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import {
  deleteContactForAccount,
  getContactForAccount,
  updateContactForAccount,
} from "@/lib/db/contacts";
import { updateContactSchema } from "@/lib/validation";
import type { ContactRole } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const contact = await getContactForAccount(accountId, id);
    return json({ contact });
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
    const input = updateContactSchema.parse(body);
    const accountId = await getCurrentAccountId();
    const contact = await updateContactForAccount(accountId, id, {
      ...input,
      role: input.role as ContactRole | undefined,
    });
    return json({ contact });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const contact = await deleteContactForAccount(accountId, id);
    return json({ contact });
  } catch (error) {
    return errorResponse(error);
  }
}
