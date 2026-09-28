import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getUnresolvedSignalById } from "@/lib/db/discovery";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const item = await getUnresolvedSignalById(id);
    return json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
