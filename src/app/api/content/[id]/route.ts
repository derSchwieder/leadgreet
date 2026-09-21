import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { deleteContentItem, getContentItemById, updateContentItem } from "@/lib/db/content";
import { updateContentItemSchema } from "@/lib/validation";
import type { BusinessCaseType, CompanySize, ContactRole, ContentType } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const item = await getContentItemById(accountId, id);
    return json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const body: unknown = await request.json();
    const input = updateContentItemSchema.parse(body);
    const accountId = await getCurrentAccountId();
    const item = await updateContentItem(accountId, id, {
      name: input.name,
      description: input.description,
      type: input.type as ContentType | undefined,
      url: input.url,
      fileName: input.fileName,
      mimeType: input.mimeType,
      tags: input.tags,
      businessCaseTypes: input.businessCaseTypes as BusinessCaseType[] | undefined,
      targetRoles: input.targetRoles as ContactRole[] | undefined,
      targetCompanySizes: input.targetCompanySizes as CompanySize[] | undefined,
      serviceIds: input.serviceIds,
      isActive: input.isActive,
    });
    return json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const item = await deleteContentItem(accountId, id);
    return json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}
