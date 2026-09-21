import { NextResponse } from "next/server";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { createActivity, listActivities } from "@/lib/db/activities";
import { listContacts } from "@/lib/db/contacts";
import { createActivitySchema } from "@/lib/validation";
import type { ActivityOutcome, ActivityType } from "@/types";

export const dynamic = "force-dynamic";

async function withContactNames(
  accountId: string,
  opportunityId: string,
) {
  const activities = await listActivities(accountId, opportunityId);
  const companyId = activities[0]?.companyId;
  const contacts = companyId ? await listContacts({ companyId }) : [];
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));

  return activities.map((activity) => {
    const contact = activity.contactId ? byId.get(activity.contactId) : undefined;
    return {
      ...activity,
      contactName: contact?.fullName ?? null,
      contactRole: contact?.role ?? null,
    };
  });
}

export async function GET(request: Request) {
  try {
    requireDatabase();
    const opportunityId = new URL(request.url).searchParams.get("opportunityId")?.trim();
    if (!opportunityId) {
      return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
    }

    const accountId = await getCurrentAccountId();
    const activities = await withContactNames(accountId, opportunityId);
    return json({ activities });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = createActivitySchema.parse(body);
    const accountId = await getCurrentAccountId();
    const activity = await createActivity(accountId, {
      opportunityId: input.opportunityId,
      companyId: input.companyId,
      contactId: input.contactId,
      type: input.type as ActivityType,
      subject: input.subject,
      note: input.note,
      occurredAt: input.occurredAt,
      outcome: input.outcome as ActivityOutcome | null,
      outcomeNote: input.outcomeNote,
      responseToActivityId: input.responseToActivityId,
    });
    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
