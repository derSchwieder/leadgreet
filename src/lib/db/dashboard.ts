import { SIGNAL_TYPE_CATEGORY, type SignalCategory } from "@/types";
import { HOT_OPPORTUNITY_THRESHOLD } from "@/lib/scoring";
import { prisma } from "./client";
import { serializeCompany } from "./serialize";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface DashboardData {
  kpis: {
    companies: number;
    newSignals: number;
    hotOpportunities: number;
    newContacts: number;
  };
  hotOpportunities: Array<{
    id: string;
    title: string;
    opportunityScore: number;
    freshness: number;
    recommendedApproach: string | null;
    company: { id: string; name: string };
    primarySignal: { id: string; title: string; type: string; detectedAt: Date } | null;
    contact: { id: string; fullName: string; role: string } | null;
    signalAgeDays: number | null;
  }>;
  signalsThisWeek: Record<SignalCategory, number>;
  recentSignals: Array<{
    id: string;
    title: string;
    type: string;
    detectedAt: Date;
    signalStrength: number;
    company: { id: string; name: string };
    isSeed: boolean;
  }>;
  seedCounts: {
    companies: number;
    signals: number;
    contacts: number;
    opportunities: number;
  };
}

export async function getDashboardData(
  accountId: string,
  now: Date = new Date(),
): Promise<DashboardData> {
  const weekAgo = new Date(now.getTime() - WEEK_MS);

  const [
    companies,
    newSignals,
    hotOpportunitiesCount,
    newContacts,
    hotRows,
    weekSignals,
    recentSignals,
    seedCompanies,
    seedSignals,
    seedContacts,
    seedOpportunities,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.signal.count({ where: { detectedAt: { gte: weekAgo } } }),
    prisma.opportunity.count({
      where: {
        accountId,
        opportunityScore: { gte: HOT_OPPORTUNITY_THRESHOLD },
        status: { notIn: ["LOST", "DISMISSED"] },
      },
    }),
    prisma.contact.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.opportunity.findMany({
      where: {
        accountId,
        opportunityScore: { gte: HOT_OPPORTUNITY_THRESHOLD },
        status: { notIn: ["LOST", "DISMISSED"] },
      },
      include: {
        company: true,
        recommendedContact: { select: { id: true, fullName: true, role: true } },
        signals: {
          orderBy: { detectedAt: "desc" },
          take: 1,
          select: { id: true, title: true, type: true, detectedAt: true, eventDate: true },
        },
      },
      orderBy: { opportunityScore: "desc" },
      take: 8,
    }),
    prisma.signal.findMany({
      where: { detectedAt: { gte: weekAgo } },
      select: { type: true },
    }),
    prisma.signal.findMany({
      include: { company: { select: { id: true, name: true } } },
      orderBy: { detectedAt: "desc" },
      take: 8,
    }),
    prisma.company.count({ where: { isSeed: true } }),
    prisma.signal.count({ where: { isSeed: true } }),
    prisma.contact.count({ where: { isSeed: true } }),
    prisma.opportunity.count({ where: { accountId, isSeed: true } }),
  ]);

  const signalsThisWeek: Record<SignalCategory, number> = {
    AI: 0,
    CLOUD: 0,
    DATA: 0,
    AUTOMATION: 0,
    IT_TRANSFORMATION: 0,
    LEADERSHIP: 0,
    INVESTMENT: 0,
    OTHER: 0,
  };

  for (const signal of weekSignals) {
    const category = SIGNAL_TYPE_CATEGORY[signal.type];
    signalsThisWeek[category] += 1;
  }

  return {
    kpis: {
      companies,
      newSignals,
      hotOpportunities: hotOpportunitiesCount,
      newContacts,
    },
    hotOpportunities: hotRows.map((row) => {
      const primary = row.signals[0] ?? null;
      const reference = primary?.eventDate ?? primary?.detectedAt ?? null;
      const signalAgeDays = reference
        ? Math.max(0, Math.floor((now.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24)))
        : null;
      return {
        id: row.id,
        title: row.title,
        opportunityScore: row.opportunityScore,
        freshness: row.freshness,
        recommendedApproach: row.recommendedApproach,
        company: { id: row.company.id, name: serializeCompany(row.company).name },
        primarySignal: primary
          ? {
              id: primary.id,
              title: primary.title,
              type: primary.type,
              detectedAt: primary.detectedAt,
            }
          : null,
        contact: row.recommendedContact,
        signalAgeDays,
      };
    }),
    signalsThisWeek,
    recentSignals: recentSignals.map((signal) => ({
      id: signal.id,
      title: signal.title,
      type: signal.type,
      detectedAt: signal.detectedAt,
      signalStrength: signal.signalStrength,
      company: signal.company,
      isSeed: signal.isSeed,
    })),
    seedCounts: {
      companies: seedCompanies,
      signals: seedSignals,
      contacts: seedContacts,
      opportunities: seedOpportunities,
    },
  };
}

export async function getSeedInventory() {
  const [companies, signals, contacts, opportunities, sources] = await Promise.all([
    prisma.company.count({ where: { isSeed: true } }),
    prisma.signal.count({ where: { isSeed: true } }),
    prisma.contact.count({ where: { isSeed: true } }),
    prisma.opportunity.count({ where: { isSeed: true } }),
    prisma.source.count({ where: { isSeed: true } }),
  ]);
  return { companies, signals, contacts, opportunities, sources };
}
