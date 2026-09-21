import { NextResponse } from "next/server";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { createContentItem, listContentItems } from "@/lib/db/content";
import { createContentItemSchema } from "@/lib/validation";
import {
  BUSINESS_CASE_TYPES,
  CONTENT_TYPES,
  type BusinessCaseType,
  type CompanySize,
  type ContactRole,
  type ContentType,
} from "@/types";

export const dynamic = "force-dynamic";

function parseContentType(value: string | undefined): ContentType | undefined {
  return CONTENT_TYPES.includes(value as ContentType) ? (value as ContentType) : undefined;
}

function parseBusinessCase(value: string | undefined): BusinessCaseType | undefined {
  return BUSINESS_CASE_TYPES.includes(value as BusinessCaseType)
    ? (value as BusinessCaseType)
    : undefined;
}

export async function GET(request: Request) {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const params = new URL(request.url).searchParams;
    const type = parseContentType(params.get("type")?.trim() || undefined);
    const serviceId = params.get("serviceId")?.trim() || undefined;
    const businessCaseType = parseBusinessCase(params.get("businessCase")?.trim() || undefined);
    const active = params.get("active")?.trim();

    const items = await listContentItems(accountId, {
      type,
      serviceId,
      businessCaseType,
      isActive: active === "true" ? true : active === "false" ? false : undefined,
    });
    return json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = createContentItemSchema.parse(body);
    const accountId = await getCurrentAccountId();
    const item = await createContentItem(accountId, {
      name: input.name,
      description: input.description,
      type: input.type as ContentType,
      url: input.url,
      fileName: input.fileName,
      mimeType: input.mimeType,
      tags: input.tags,
      businessCaseTypes: input.businessCaseTypes as BusinessCaseType[],
      targetRoles: input.targetRoles as ContactRole[],
      targetCompanySizes: input.targetCompanySizes as CompanySize[],
      serviceIds: input.serviceIds,
      isActive: input.isActive,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
