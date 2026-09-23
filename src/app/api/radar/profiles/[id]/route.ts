import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import {
  deleteRadarProfile,
  getRadarProfile,
  updateRadarProfile,
} from "@/lib/db/radar-profiles";
import { parseAccountIcp } from "@/lib/icp";
import { updateRadarProfileSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const profile = await getRadarProfile(accountId, id);
    return json({ profile });
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
    const accountId = await getCurrentAccountId();
    const body: unknown = await request.json();
    const input = updateRadarProfileSchema.parse(body);
    const icp = parseAccountIcp({
      industries: input.industries ?? [],
      countries: input.countries ?? [],
      minEmployees: input.minEmployees ?? null,
      minRevenue: input.minRevenue ?? null,
    });
    const profile = await updateRadarProfile(accountId, id, {
      name: input.name,
      industries: input.industries !== undefined ? icp.industries : undefined,
      countries: input.countries !== undefined ? icp.countries : undefined,
      minEmployees: input.minEmployees,
      minRevenue: input.minRevenue,
      greetThreshold: input.greetThreshold,
      isActive: input.isActive,
    });
    return json({ profile });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return PATCH(request, context);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    await deleteRadarProfile(accountId, id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
