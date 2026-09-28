import { errorResponse, json, requireDatabase, searchParamsObject } from "@/lib/api";
import { listUnresolvedSignals } from "@/lib/db/discovery";
import { discoveryListQuerySchema } from "@/lib/validation";
import type { SignalType, UnresolvedSignalStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireDatabase();
    const query = discoveryListQuerySchema.parse(searchParamsObject(new URL(request.url)));
    const items = await listUnresolvedSignals({
      status: query.status as UnresolvedSignalStatus | undefined,
      signalType: query.signalType as SignalType | undefined,
      limit: query.limit,
    });
    return json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}
