import { NextResponse } from "next/server";
import { createCompany, listCompanies } from "@/lib/db/companies";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { createCompanySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireDatabase();
    const companies = await listCompanies();
    return json({ companies });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = createCompanySchema.parse(body);
    const company = await createCompany({
      ...input,
      companySize: input.companySize as import("@/types").CompanySize | null,
    });
    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
