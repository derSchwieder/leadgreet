import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { NormalizedScreeningInput } from "../normalize";
import { matchLocalCompany } from "./local-company-researcher";
import type { CompanyCatalogPort, LocalCatalogCompany, LocalCatalogSignal } from "./types";

export class PrismaCompanyCatalog implements CompanyCatalogPort {
  async findByNameOrDomain(input: NormalizedScreeningInput): Promise<LocalCatalogCompany | null> {
    const or: Prisma.CompanyWhereInput[] = [
      { name: { equals: input.name, mode: "insensitive" } },
      { legalName: { equals: input.name, mode: "insensitive" } },
    ];
    if (input.domain) {
      or.push({ website: { contains: input.domain, mode: "insensitive" } });
    }

    const rows = await prisma.company.findMany({
      where: { OR: or },
      select: {
        id: true,
        name: true,
        legalName: true,
        website: true,
        industry: true,
        city: true,
        country: true,
        employees: true,
        revenue: true,
        ownership: true,
        description: true,
      },
    });

    return matchLocalCompany(
      rows.map((row) => ({
        ...row,
        revenue: row.revenue == null ? null : row.revenue.toString(),
      })),
      input,
    );
  }

  async listSignals(companyId: string): Promise<LocalCatalogSignal[]> {
    const rows = await prisma.signal.findMany({
      where: { companyId },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        detectedAt: true,
        sourceName: true,
        sourceUrl: true,
        source: { select: { name: true, url: true } },
      },
      orderBy: { detectedAt: "desc" },
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      detectedAt: row.detectedAt,
      sourceName: row.sourceName ?? row.source?.name ?? null,
      sourceUrl: row.sourceUrl ?? row.source?.url ?? null,
    }));
  }
}
