import { NextResponse } from "next/server";
import { createOpportunity, listOpportunities } from "@/lib/db/opportunities";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { createOpportunitySchema } from "@/lib/validation";
import type { OpportunityStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const opportunities = await listOpportunities();
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
    const opportunity = await createOpportunity({
      ...input,
      status: input.status as OpportunityStatus,
    });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
