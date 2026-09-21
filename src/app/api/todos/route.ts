import { NextResponse } from "next/server";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { listContacts } from "@/lib/db/contacts";
import { createSalesTodo, listSalesTodos } from "@/lib/db/todos";
import { createSalesTodoSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

async function withContactDisplay(accountId: string, opportunityId: string) {
  const todos = await listSalesTodos(accountId, opportunityId);
  const companyId = todos[0]?.companyId;
  const contacts = companyId ? await listContacts({ companyId }) : [];
  const byId = new Map(contacts.map((contact) => [contact.id, contact]));

  return todos.map((todo) => {
    const contact = todo.contactId ? byId.get(todo.contactId) : undefined;
    return {
      ...todo,
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
    const todos = await withContactDisplay(accountId, opportunityId);
    return json({ todos });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = createSalesTodoSchema.parse(body);
    const accountId = await getCurrentAccountId();
    const todo = await createSalesTodo(accountId, {
      opportunityId: input.opportunityId,
      companyId: input.companyId,
      title: input.title,
      dueAt: input.dueAt,
      contactId: input.contactId,
      relatedActivityId: input.relatedActivityId,
    });
    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
