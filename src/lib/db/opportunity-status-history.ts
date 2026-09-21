import type { OpportunityStatus, OpportunityStatusHistory } from "@prisma/client";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export interface CreateStatusHistoryInput {
  opportunityId: string;
  fromStatus?: OpportunityStatus | null;
  toStatus: OpportunityStatus;
  userId?: string | null;
  note?: string | null;
  changedAt?: Date;
}

export async function listStatusHistory(
  accountId: string,
  opportunityId: string,
): Promise<OpportunityStatusHistory[]> {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, accountId },
    select: { id: true },
  });
  if (!opportunity) {
    throw new NotFoundError("Opportunity", opportunityId);
  }

  return prisma.opportunityStatusHistory.findMany({
    where: { accountId, opportunityId },
    orderBy: { changedAt: "asc" },
  });
}

export async function createStatusHistory(
  accountId: string,
  input: CreateStatusHistoryInput,
): Promise<OpportunityStatusHistory> {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: input.opportunityId, accountId },
    select: { id: true },
  });
  if (!opportunity) {
    throw new NotFoundError("Opportunity", input.opportunityId);
  }

  if (input.userId) {
    const user = await prisma.user.findFirst({
      where: { id: input.userId, accountId },
    });
    if (!user) {
      throw new NotFoundError("User", input.userId);
    }
  }

  return prisma.opportunityStatusHistory.create({
    data: {
      accountId,
      opportunityId: opportunity.id,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus,
      userId: input.userId ?? null,
      note: input.note ?? null,
      ...(input.changedAt ? { changedAt: input.changedAt } : {}),
    },
  });
}
