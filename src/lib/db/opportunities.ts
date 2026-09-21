import type { Opportunity, OpportunityStatus, Prisma } from "@prisma/client";
import { scoreOpportunity } from "@/lib/scoring";
import type { ScoringCompanyInput, ScoringContactInput, ScoringSignalInput } from "@/lib/scoring";
import { SIGNAL_TYPE_LABELS } from "@/lib/labels";
import { prisma } from "./client";
import { createStatusHistory } from "./opportunity-status-history";
import { NotFoundError, serializeCompany } from "./serialize";

export interface CreateOpportunityInput {
  accountId: string;
  companyId: string;
  title?: string;
  description?: string | null;
  recommendedApproach?: string | null;
  whyNow?: string | null;
  status?: OpportunityStatus;
  recommendedContactId?: string | null;
  signalIds?: string[];
  isSeed?: boolean;
}

export type OpportunityWithRelations = Opportunity & {
  company: ReturnType<typeof serializeCompany> extends infer C ? C : never;
  recommendedContact: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string | null;
    role: import("@prisma/client").ContactRole;
    isDecisionMaker: boolean;
  } | null;
  signals: Array<{
    id: string;
    type: import("@prisma/client").SignalType;
    title: string;
    detectedAt: Date;
    eventDate: Date | null;
    sourceName: string | null;
    sourceUrl: string | null;
    sourceType: import("@prisma/client").SourceType | null;
    signalStrength: number;
  }>;
  scoreBreakdown: {
    id: string;
    signalStrength: number;
    freshness: number;
    companyFit: number;
    contactFit: number;
    confidence: number;
    totalScore: number;
    explanation: string;
    createdAt: Date;
  } | null;
};

const opportunityInclude = {
  company: true,
  recommendedContact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      role: true,
      isDecisionMaker: true,
      email: true,
      confidenceScore: true,
      department: true,
      linkedinUrl: true,
    },
  },
  signals: {
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      detectedAt: true,
      eventDate: true,
      sourceName: true,
      sourceUrl: true,
      signalStrength: true,
      source: {
        select: {
          sourceType: true,
          credibilityScore: true,
          url: true,
          name: true,
        },
      },
    },
  },
  scoreBreakdown: true,
} satisfies Prisma.OpportunityInclude;

function mapOpportunity(
  row: Prisma.OpportunityGetPayload<{ include: typeof opportunityInclude }>,
): OpportunityWithRelations {
  return {
    ...row,
    company: serializeCompany(row.company),
    recommendedContact: row.recommendedContact
      ? {
          id: row.recommendedContact.id,
          firstName: row.recommendedContact.firstName,
          lastName: row.recommendedContact.lastName,
          fullName: row.recommendedContact.fullName,
          email: row.recommendedContact.email,
          role: row.recommendedContact.role,
          isDecisionMaker: row.recommendedContact.isDecisionMaker,
        }
      : null,
    signals: row.signals.map((signal) => ({
      id: signal.id,
      type: signal.type,
      title: signal.title,
      detectedAt: signal.detectedAt,
      eventDate: signal.eventDate,
      sourceName: signal.sourceName ?? signal.source?.name ?? null,
      sourceUrl: signal.sourceUrl ?? signal.source?.url ?? null,
      sourceType: signal.source?.sourceType ?? null,
      signalStrength: signal.signalStrength,
    })),
    scoreBreakdown: row.scoreBreakdown,
  };
}

function toScoringInputs(
  row: Prisma.OpportunityGetPayload<{ include: typeof opportunityInclude }>,
): {
  company: ScoringCompanyInput;
  signals: ScoringSignalInput[];
  contact: ScoringContactInput | null;
} {
  return {
    company: {
      industry: row.company.industry,
      subIndustry: row.company.subIndustry,
      country: row.company.country,
      employees: row.company.employees,
      companySize: row.company.companySize,
      website: row.company.website,
      city: row.company.city,
      revenue: row.company.revenue?.toString() ?? null,
    },
    signals: row.signals.map((signal) => ({
      type: signal.type,
      detectedAt: signal.detectedAt,
      eventDate: signal.eventDate,
      sourceType: signal.source?.sourceType ?? null,
      sourceCredibility: signal.source?.credibilityScore ?? null,
      sourceUrl: signal.sourceUrl,
      title: signal.title,
      description: signal.description,
    })),
    contact: row.recommendedContact
      ? {
          role: row.recommendedContact.role,
          isDecisionMaker: row.recommendedContact.isDecisionMaker,
          confidenceScore: row.recommendedContact.confidenceScore,
          email: row.recommendedContact.email,
          linkedinUrl: row.recommendedContact.linkedinUrl,
          department: row.recommendedContact.department,
        }
      : null,
  };
}

export async function listOpportunities(accountId: string): Promise<OpportunityWithRelations[]> {
  const rows = await prisma.opportunity.findMany({
    where: { accountId },
    include: opportunityInclude,
    orderBy: [{ opportunityScore: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(mapOpportunity);
}

export async function getOpportunityById(
  id: string,
  accountId: string,
): Promise<OpportunityWithRelations> {
  const row = await prisma.opportunity.findFirst({
    where: { id, accountId },
    include: opportunityInclude,
  });
  if (!row) {
    throw new NotFoundError("Opportunity", id);
  }
  return mapOpportunity(row);
}

export async function findActiveOpportunityByCompany(
  accountId: string,
  companyId: string,
): Promise<{ id: string } | null> {
  const row = await prisma.opportunity.findFirst({
    where: {
      accountId,
      companyId,
      status: { notIn: ["LOST", "DISMISSED"] },
    },
    select: { id: true },
    orderBy: [{ opportunityScore: "desc" }, { createdAt: "desc" }],
  });
  return row;
}

export async function findOrCreateOpportunityForCompany(
  accountId: string,
  companyId: string,
): Promise<{ opportunityId: string; created: boolean }> {
  const existing = await findActiveOpportunityByCompany(accountId, companyId);
  if (existing) {
    return { opportunityId: existing.id, created: false };
  }

  const created = await createOpportunity({
    accountId,
    companyId,
    status: "NEW",
  });
  return { opportunityId: created.id, created: true };
}

/** Manual status change for the owning account. Does not apply automatic status rules. */
export async function updateOpportunityStatus(
  accountId: string,
  opportunityId: string,
  toStatus: OpportunityStatus,
  note?: string | null,
): Promise<OpportunityWithRelations> {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, accountId },
    select: { id: true, status: true },
  });
  if (!opportunity) {
    throw new NotFoundError("Opportunity", opportunityId);
  }

  if (opportunity.status === toStatus) {
    return getOpportunityById(opportunityId, accountId);
  }

  await prisma.opportunity.update({
    where: { id: opportunity.id },
    data: { status: toStatus },
  });

  await createStatusHistory(accountId, {
    opportunityId: opportunity.id,
    fromStatus: opportunity.status,
    toStatus,
    note: note ?? null,
  });

  return getOpportunityById(opportunityId, accountId);
}

export async function createOpportunity(
  input: CreateOpportunityInput,
): Promise<OpportunityWithRelations> {
  const company = await prisma.company.findUnique({ where: { id: input.companyId } });
  if (!company) {
    throw new NotFoundError("Company", input.companyId);
  }

  const accountId = input.accountId.trim();
  if (!accountId) {
    throw new Error("accountId is required");
  }

  const signalIds = input.signalIds ?? [];
  const signals = signalIds.length
    ? await prisma.signal.findMany({
        where: { id: { in: signalIds }, companyId: input.companyId },
        include: { source: true },
      })
    : await prisma.signal.findMany({
        where: { companyId: input.companyId, status: { not: "DISMISSED" } },
        include: { source: true },
        orderBy: { detectedAt: "desc" },
        take: 5,
      });

  const contact = input.recommendedContactId
    ? await prisma.contact.findUnique({
        where: { id: input.recommendedContactId },
        omit: { notes: true },
      })
    : await prisma.contact.findFirst({
        where: { companyId: input.companyId },
        orderBy: [{ isDecisionMaker: "desc" }, { confidenceScore: "desc" }],
        omit: { notes: true },
      });

  const scored = scoreOpportunity({
    company: {
      industry: company.industry,
      subIndustry: company.subIndustry,
      country: company.country,
      employees: company.employees,
      companySize: company.companySize,
      website: company.website,
      city: company.city,
      revenue: company.revenue?.toString() ?? null,
    },
    signals: signals.map((signal) => ({
      type: signal.type,
      detectedAt: signal.detectedAt,
      eventDate: signal.eventDate,
      sourceType: signal.source?.sourceType ?? null,
      sourceCredibility: signal.source?.credibilityScore ?? null,
      sourceUrl: signal.sourceUrl,
      title: signal.title,
      description: signal.description,
    })),
    contact: contact
      ? {
          role: contact.role,
          isDecisionMaker: contact.isDecisionMaker,
          confidenceScore: contact.confidenceScore,
          email: contact.email,
          linkedinUrl: contact.linkedinUrl,
          department: contact.department,
        }
      : null,
  });

  const primary = signals[0];
  const title =
    input.title ??
    (primary
      ? `${company.name} — ${SIGNAL_TYPE_LABELS[primary.type] ?? primary.type}`
      : `${company.name} — Chance`);

  const row = await prisma.opportunity.create({
    data: {
      accountId,
      companyId: input.companyId,
      title,
      description: input.description ?? primary?.description ?? null,
      recommendedApproach:
        input.recommendedApproach ??
        "Prüfen Sie das aktuelle Signal mit dem hinterlegten Kontakt. Klären Sie Timing und Budgetverantwortliche und ob bereits ein externer Partner eingebunden ist.",
      whyNow: input.whyNow ?? scored.whyNow,
      opportunityScore: scored.opportunityScore,
      signalStrength: scored.signalStrength,
      companyFit: scored.companyFit,
      contactFit: scored.contactFit,
      freshness: scored.freshness,
      confidence: scored.confidence,
      status: input.status ?? "NEW",
      recommendedContactId: contact?.id ?? null,
      isSeed: input.isSeed ?? false,
      signals: signals.length
        ? { connect: signals.map((signal) => ({ id: signal.id })) }
        : undefined,
      scoreBreakdown: {
        create: {
          signalStrength: scored.signalStrength,
          freshness: scored.freshness,
          companyFit: scored.companyFit,
          contactFit: scored.contactFit,
          confidence: scored.confidence,
          totalScore: scored.opportunityScore,
          explanation: scored.explanation,
        },
      },
    },
    include: opportunityInclude,
  });

  return mapOpportunity(row);
}

export { toScoringInputs };
