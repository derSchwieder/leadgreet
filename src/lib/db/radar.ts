import { prisma } from "./client";
import { buildRadarPoints } from "@/lib/radar/points";
import type { RadarPoint } from "@/lib/radar/types";

/**
 * Account-scoped Greet Radar points.
 * Greet is the stored opportunityScore of the leading opportunity for this account.
 * Coordinates come from the MVP demo city map, not from geocoding or Company lat/lng.
 */
export async function listRadarPoints(accountId: string): Promise<RadarPoint[]> {
  const opportunities = await prisma.opportunity.findMany({
    where: {
      accountId,
      status: { notIn: ["LOST", "DISMISSED"] },
    },
    select: {
      companyId: true,
      opportunityScore: true,
      company: {
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          website: true,
        },
      },
      signals: {
        select: { title: true, signalStrength: true, detectedAt: true },
        orderBy: [{ signalStrength: "desc" }, { detectedAt: "desc" }],
        take: 1,
      },
    },
    orderBy: [{ opportunityScore: "desc" }, { createdAt: "desc" }],
  });

  const seen = new Set<string>();
  const candidates = [];

  for (const row of opportunities) {
    if (seen.has(row.companyId)) continue;
    seen.add(row.companyId);
    candidates.push({
      companyId: row.company.id,
      name: row.company.name,
      city: row.company.city,
      country: row.company.country,
      greet: row.opportunityScore,
      signalTitle: row.signals[0]?.title ?? null,
      website: row.company.website,
    });
  }

  return buildRadarPoints(candidates);
}
