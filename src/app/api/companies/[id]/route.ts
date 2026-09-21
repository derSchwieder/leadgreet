import { getCompanyById } from "@/lib/db/companies";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { listContacts } from "@/lib/db/contacts";
import { listOpportunities } from "@/lib/db/opportunities";
import { listSignals } from "@/lib/db/signals";
import { errorResponse, json, requireDatabase } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireDatabase();
    const { id } = await context.params;
    const accountId = await getCurrentAccountId();
    const [company, signals, contacts, opportunities] = await Promise.all([
      getCompanyById(id),
      listSignals({ companyId: id }),
      listContacts({ companyId: id }),
      listOpportunities(accountId),
    ]);

    return json({
      company,
      signals,
      contacts,
      opportunities: opportunities.filter((item) => item.companyId === id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
