import { getDashboardData } from "@/lib/db/dashboard";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { errorResponse, json, requireDatabase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const dashboard = await getDashboardData(accountId);
    return json({ dashboard });
  } catch (error) {
    return errorResponse(error);
  }
}
