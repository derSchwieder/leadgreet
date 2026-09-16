import { getDashboardData } from "@/lib/db/dashboard";
import { errorResponse, json, requireDatabase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const dashboard = await getDashboardData();
    return json({ dashboard });
  } catch (error) {
    return errorResponse(error);
  }
}
