import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { deleteActivity, updateActivity } from "@/lib/db/activities";
import { updateActivitySchema } from "@/lib/validation";
import type { ActivityOutcome, ActivityType } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const body: unknown = await request.json();
    const input = updateActivitySchema.parse(body);
    const accountId = await getCurrentAccountId();
    const activity = await updateActivity(accountId, id, {
      contactId: input.contactId,
      type: input.type as ActivityType | undefined,
      subject: input.subject,
      note: input.note,
      occurredAt: input.occurredAt,
      outcome: input.outcome as ActivityOutcome | null | undefined,
      outcomeNote: input.outcomeNote,
      responseToActivityId: input.responseToActivityId,
    });
    return json({ activity });
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
    const activity = await deleteActivity(accountId, id);
    return json({ activity });
  } catch (error) {
    return errorResponse(error);
  }
}
