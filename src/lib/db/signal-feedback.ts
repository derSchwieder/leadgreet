import type { Prisma, SignalFeedback as SignalFeedbackRow } from "@prisma/client";
import type { SignalFeedback, SignalFeedbackReason } from "@/types";
import { SCORING_WEIGHTS } from "@/lib/scoring";
import { prisma } from "./client";
import { getCompanyGreet } from "./company-greet";
import { getCompanyIntelligence } from "./intelligence";
import { getSignalById } from "./signals";

export type SignalFeedbackScoringWeights = {
  signalStrength: number;
  freshness: number;
  companyFit: number;
  contactFit: number;
  confidence: number;
};

export type UpsertSignalFeedbackInput = {
  signalId: string;
  relevant: boolean;
  reason?: SignalFeedbackReason | null;
};

function toScoringWeights(value: Prisma.JsonValue): SignalFeedbackScoringWeights {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const read = (key: keyof SignalFeedbackScoringWeights) => {
    const raw = (record as Record<string, unknown>)[key];
    return typeof raw === "number" && Number.isFinite(raw) ? raw : SCORING_WEIGHTS[key];
  };
  return {
    signalStrength: read("signalStrength"),
    freshness: read("freshness"),
    companyFit: read("companyFit"),
    contactFit: read("contactFit"),
    confidence: read("confidence"),
  };
}

function mapFeedback(row: SignalFeedbackRow): SignalFeedback {
  return {
    id: row.id,
    signalId: row.signalId,
    companyId: row.companyId,
    accountId: row.accountId,
    userId: row.userId,
    relevant: row.relevant,
    reason: row.reason,
    greetScore: row.greetScore,
    signalStrength: row.signalStrength,
    freshness: row.freshness,
    companyFit: row.companyFit,
    contactFit: row.contactFit,
    confidence: row.confidence,
    serviceFit: row.serviceFit,
    businessCase: row.businessCase,
    scoringWeights: toScoringWeights(row.scoringWeights),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function isMissingSignalFeedbackTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "P2021" && /SignalFeedback/i.test(candidate.message ?? "")) return true;
  return (
    typeof candidate.message === "string" &&
    /SignalFeedback/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

export async function captureSignalFeedbackContext(accountId: string, signalId: string) {
  const signal = await getSignalById(signalId);
  const [greet, intelligence] = await Promise.all([
    getCompanyGreet(signal.companyId),
    getCompanyIntelligence(signal.companyId, accountId),
  ]);

  return {
    companyId: signal.companyId,
    greetScore: greet.opportunityScore,
    signalStrength: greet.signalStrength,
    freshness: greet.freshness,
    companyFit: greet.companyFit,
    contactFit: greet.contactFit,
    confidence: greet.confidence,
    serviceFit: intelligence.primaryService?.matchScore ?? null,
    businessCase: intelligence.primaryBusinessCase?.type ?? null,
    scoringWeights: { ...SCORING_WEIGHTS } satisfies SignalFeedbackScoringWeights,
  };
}

export async function getSignalFeedback(
  accountId: string,
  userId: string,
  signalId: string,
): Promise<SignalFeedback | null> {
  const row = await prisma.signalFeedback.findUnique({
    where: {
      accountId_userId_signalId: { accountId, userId, signalId },
    },
  });
  return row ? mapFeedback(row) : null;
}

export async function listSignalFeedbackForCompany(
  accountId: string,
  userId: string,
  companyId: string,
): Promise<SignalFeedback[]> {
  const rows = await prisma.signalFeedback.findMany({
    where: { accountId, userId, companyId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapFeedback);
}

export async function upsertSignalFeedback(
  accountId: string,
  userId: string,
  input: UpsertSignalFeedbackInput,
): Promise<SignalFeedback> {
  const context = await captureSignalFeedbackContext(accountId, input.signalId);
  const existing = await prisma.signalFeedback.findUnique({
    where: {
      accountId_userId_signalId: {
        accountId,
        userId,
        signalId: input.signalId,
      },
    },
    select: { relevant: true, reason: true },
  });

  const reason =
    input.reason !== undefined
      ? input.reason
      : existing && existing.relevant === input.relevant
        ? existing.reason
        : null;

  const row = await prisma.signalFeedback.upsert({
    where: {
      accountId_userId_signalId: {
        accountId,
        userId,
        signalId: input.signalId,
      },
    },
    create: {
      signalId: input.signalId,
      companyId: context.companyId,
      accountId,
      userId,
      relevant: input.relevant,
      reason,
      greetScore: context.greetScore,
      signalStrength: context.signalStrength,
      freshness: context.freshness,
      companyFit: context.companyFit,
      contactFit: context.contactFit,
      confidence: context.confidence,
      serviceFit: context.serviceFit,
      businessCase: context.businessCase,
      scoringWeights: context.scoringWeights,
    },
    update: {
      relevant: input.relevant,
      reason,
      greetScore: context.greetScore,
      signalStrength: context.signalStrength,
      freshness: context.freshness,
      companyFit: context.companyFit,
      contactFit: context.contactFit,
      confidence: context.confidence,
      serviceFit: context.serviceFit,
      businessCase: context.businessCase,
      scoringWeights: context.scoringWeights,
    },
  });

  return mapFeedback(row);
}
