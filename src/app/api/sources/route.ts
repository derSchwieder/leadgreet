import { listSources } from "@/lib/db/sources";
import { errorResponse, json, requireDatabase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const sources = await listSources();
    return json({ sources });
  } catch (error) {
    return errorResponse(error);
  }
}
