import { prisma } from "./client";
import { COMPANY_GREET_SIGNAL_TAKE, computeCompanyGreet } from "./company-greet";
import { buildRadarPoints } from "@/lib/radar/points";
import type { RadarPoint } from "@/lib/radar/types";

function toOptionalNumber(value: { toString(): string } | number | null): number | null {
  if (value == null) return null;
  const numeric = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(numeric) ? numeric : null;
}

function primarySignalTitle(
  signals: Array<{ title: string; signalStrength: number; detectedAt: Date }>,
): string | null {
  if (signals.length === 0) return null;
  const ranked = [...signals].sort((left, right) => {
    if (right.signalStrength !== left.signalStrength) {
      return right.signalStrength - left.signalStrength;
    }
    return right.detectedAt.getTime() - left.detectedAt.getTime();
  });
  return ranked[0]?.title ?? null;
}

/**
 * Greet Radar points from current Company-Greet.
 * Greet is scored live from the company's current relevant signals (same
 * formula as opportunity scoring). An Opportunity is not required.
 * Coordinates prefer stored Company lat/lng when present, otherwise the MVP demo city map.
 * Companies without either are omitted rather than misplaced.
 */
export async function listRadarPoints(_accountId: string): Promise<RadarPoint[]> {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      website: true,
      latitude: true,
      longitude: true,
      industry: true,
      subIndustry: true,
      employees: true,
      companySize: true,
      revenue: true,
      signals: {
        where: { status: { not: "DISMISSED" } },
        include: {
          source: {
            select: {
              sourceType: true,
              credibilityScore: true,
            },
          },
        },
        orderBy: { detectedAt: "desc" },
        take: COMPANY_GREET_SIGNAL_TAKE,
      },
      contacts: {
        orderBy: [{ isDecisionMaker: "desc" }, { confidenceScore: "desc" }],
        take: 1,
        select: {
          role: true,
          isDecisionMaker: true,
          confidenceScore: true,
          email: true,
          linkedinUrl: true,
          department: true,
        },
      },
    },
  });

  const candidates = companies.map((company) => {
    const scored = computeCompanyGreet({
      company,
      signals: company.signals,
      contact: company.contacts[0] ?? null,
    });
    return {
      companyId: company.id,
      name: company.name,
      city: company.city,
      country: company.country,
      greet: scored.opportunityScore,
      signalTitle: primarySignalTitle(company.signals),
      website: company.website,
      latitude: toOptionalNumber(company.latitude),
      longitude: toOptionalNumber(company.longitude),
    };
  });

  return buildRadarPoints(candidates);
}
