import { NextResponse } from "next/server";
import { createContactForAccount, listContacts } from "@/lib/db/contacts";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { createContactSchema } from "@/lib/validation";
import type { ContactRole } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireDatabase();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") ?? undefined;
    const contacts = await listContacts({ companyId });
    return json({ contacts });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = createContactSchema.parse(body);
    const accountId = await getCurrentAccountId();
    const contact = await createContactForAccount(accountId, {
      ...input,
      role: input.role as ContactRole,
    });
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
