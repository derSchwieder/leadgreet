import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { listRadarPoints } from "@/lib/db/radar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const points = await listRadarPoints(accountId);
    return json({ points });
  } catch (error) {
    return errorResponse(error);
  }
}
