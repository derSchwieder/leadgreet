import { getDashboardData } from "@/lib/db/dashboard";
import { getTodayCockpit } from "@/lib/db/today";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { errorResponse, json, requireDatabase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const [dashboard, today] = await Promise.all([
      getDashboardData(accountId),
      getTodayCockpit(accountId),
    ]);
    return json({ dashboard, today });
  } catch (error) {
    return errorResponse(error);
  }
}
