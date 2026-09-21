import { NextResponse } from "next/server";
import { createOpportunity, listOpportunities } from "@/lib/db/opportunities";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { createOpportunitySchema } from "@/lib/validation";
import type { OpportunityStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const opportunities = await listOpportunities(accountId);
    return json({ opportunities });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = createOpportunitySchema.parse(body);
    const accountId = await getCurrentAccountId();
    const opportunity = await createOpportunity({
      accountId,
      companyId: input.companyId,
      title: input.title,
      description: input.description,
      recommendedApproach: input.recommendedApproach,
      whyNow: input.whyNow,
      status: input.status as OpportunityStatus,
      recommendedContactId: input.recommendedContactId,
      signalIds: input.signalIds,
    });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
