import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getAccountIcp, saveAccountIcp } from "@/lib/db/account-icp";
import { parseAccountIcp } from "@/lib/icp/account";
import { accountIcpSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const icp = await getAccountIcp(accountId);
    return json({ icp });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const body: unknown = await request.json();
    const icp = parseAccountIcp(accountIcpSchema.parse(body));
    const saved = await saveAccountIcp(accountId, icp);
    return json({ icp: saved });
  } catch (error) {
    return errorResponse(error);
  }
}
