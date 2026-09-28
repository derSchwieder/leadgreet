import { errorResponse, json, readJsonBody, requireDatabase, searchParamsObject } from "@/lib/api";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { createManualCompanyScreening, listCompanyScreenings } from "@/lib/db/screenings";
import { createCompanyScreeningSchema, screeningListQuerySchema } from "@/lib/validation";
import type { CompanyScreeningStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const query = screeningListQuerySchema.parse(searchParamsObject(new URL(request.url)));
    const screenings = await listCompanyScreenings(accountId, {
      status: query.status as CompanyScreeningStatus | undefined,
      limit: query.limit,
    });
    return json({ screenings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const accountId = await getCurrentAccountId();
    const input = createCompanyScreeningSchema.parse(await readJsonBody(request));
    const screening = await createManualCompanyScreening(accountId, {
      inputName: input.name,
      inputDomain: input.domain,
    });
    return json(
      {
        screening: {
          id: screening.id,
          status: screening.status,
          inputName: screening.inputName,
          inputDomain: screening.inputDomain,
          companyId: screening.companyId,
        },
      },
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
