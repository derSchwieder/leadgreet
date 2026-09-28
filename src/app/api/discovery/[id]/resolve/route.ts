import { errorResponse, json, readJsonBody, requireDatabase } from "@/lib/api";
import { resolveUnresolvedSignal } from "@/lib/db/discovery";
import { resolveUnresolvedSignalSchema } from "@/lib/validation";
import type { CompanySize } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const input = resolveUnresolvedSignalSchema.parse(await readJsonBody(request));
    const item = input.createCompany
      ? await resolveUnresolvedSignal(id, {
          createCompany: {
            ...input.createCompany,
            companySize: input.createCompany.companySize as CompanySize | null,
          },
        })
      : await resolveUnresolvedSignal(id, { companyId: input.companyId as string });
    return json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
