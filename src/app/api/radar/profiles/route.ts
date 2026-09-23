import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { createRadarProfile, listRadarProfiles } from "@/lib/db/radar-profiles";
import { parseAccountIcp } from "@/lib/icp";
import { createRadarProfileSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const profiles = await listRadarProfiles(accountId);
    return json({ profiles });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const body: unknown = await request.json();
    const input = createRadarProfileSchema.parse(body);
    const icp = parseAccountIcp({
      industries: input.industries,
      countries: input.countries,
      minEmployees: input.minEmployees,
      minRevenue: input.minRevenue,
    });
    const profile = await createRadarProfile(accountId, {
      name: input.name,
      industries: icp.industries,
      countries: icp.countries,
      minEmployees: icp.minEmployees,
      minRevenue: icp.minRevenue,
      greetThreshold: input.greetThreshold,
      isActive: input.isActive,
    });
    return json({ profile }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
