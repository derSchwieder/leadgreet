import { NextResponse } from "next/server";
import { createSignal, listSignals } from "@/lib/db/signals";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { createSignalSchema } from "@/lib/validation";
import type { SignalStatus, SignalType } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireDatabase();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") ?? undefined;
    const signals = await listSignals({ companyId });
    return json({ signals });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = createSignalSchema.parse(body);
    const signal = await createSignal({
      ...input,
      type: input.type as SignalType,
      status: input.status as SignalStatus,
    });
    return NextResponse.json({ signal }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
