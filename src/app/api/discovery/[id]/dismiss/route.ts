import { errorResponse, json, readJsonBody, requireDatabase } from "@/lib/api";
import { dismissUnresolvedSignal } from "@/lib/db/discovery";
import { dismissUnresolvedSignalSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    dismissUnresolvedSignalSchema.parse(await readJsonBody(request));
    const item = await dismissUnresolvedSignal(id);
    return json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
