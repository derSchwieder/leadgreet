import type { Signal, SignalStatus, SignalType } from "@prisma/client";
import { scoreFreshness, scoreSignalStrength } from "@/lib/scoring";
import type { ScoringSignalInput } from "@/lib/scoring";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export interface CreateSignalInput {
  companyId: string;
  type: SignalType;
  title: string;
  description?: string | null;
  detectedAt?: Date;
  eventDate?: Date | null;
  sourceId?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  status?: SignalStatus;
  isSeed?: boolean;
}

export type SignalWithRelations = Signal & {
  company: { id: string; name: string; isSeed: boolean };
  source: {
    id: string;
    name: string;
    url: string | null;
    sourceType: Signal["type"] extends never ? never : import("@prisma/client").SourceType;
    credibilityScore: number;
  } | null;
};

function toScoringSignal(
  input: CreateSignalInput,
  source: { sourceType: import("@prisma/client").SourceType; credibilityScore: number } | null,
): ScoringSignalInput {
  return {
    type: input.type,
    detectedAt: input.detectedAt ?? new Date(),
    eventDate: input.eventDate ?? null,
    sourceType: source?.sourceType ?? null,
    sourceCredibility: source?.credibilityScore ?? null,
    sourceUrl: input.sourceUrl ?? null,
    title: input.title,
    description: input.description ?? null,
  };
}

export async function listSignals(filters?: {
  companyId?: string;
  limit?: number;
}): Promise<SignalWithRelations[]> {
  return prisma.signal.findMany({
    where: filters?.companyId ? { companyId: filters.companyId } : undefined,
    include: {
      company: { select: { id: true, name: true, isSeed: true } },
      source: {
        select: {
          id: true,
          name: true,
          url: true,
          sourceType: true,
          credibilityScore: true,
        },
      },
    },
    orderBy: { detectedAt: "desc" },
    take: filters?.limit,
  });
}

export async function getSignalById(id: string): Promise<SignalWithRelations> {
  const row = await prisma.signal.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true, isSeed: true } },
      source: {
        select: {
          id: true,
          name: true,
          url: true,
          sourceType: true,
          credibilityScore: true,
        },
      },
    },
  });
  if (!row) {
    throw new NotFoundError("Signal", id);
  }
  return row;
}

export async function createSignal(input: CreateSignalInput): Promise<SignalWithRelations> {
  const source = input.sourceId
    ? await prisma.source.findUnique({ where: { id: input.sourceId } })
    : null;

  const scoringInput = toScoringSignal(input, source);
  const strength = scoreSignalStrength([scoringInput]);
  const freshness = scoreFreshness([scoringInput]);
  const confidence = source ? source.credibilityScore : 50;
  const relevance = Math.round((strength.score * 0.7 + freshness.score * 0.3));

  const row = await prisma.signal.create({
    data: {
      companyId: input.companyId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      detectedAt: input.detectedAt ?? new Date(),
      eventDate: input.eventDate ?? null,
      sourceId: input.sourceId ?? null,
      sourceUrl: input.sourceUrl ?? source?.url ?? null,
      sourceName: input.sourceName ?? source?.name ?? null,
      signalStrength: strength.score,
      freshnessScore: freshness.score,
      relevanceScore: relevance,
      confidenceScore: confidence,
      status: input.status ?? "NEW",
      isSeed: input.isSeed ?? false,
    },
    include: {
      company: { select: { id: true, name: true, isSeed: true } },
      source: {
        select: {
          id: true,
          name: true,
          url: true,
          sourceType: true,
          credibilityScore: true,
        },
      },
    },
  });

  return row;
}
