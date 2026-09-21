import type { Activity, ActivityOutcome, ActivityType, Prisma } from "@prisma/client";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export interface CreateActivityInput {
  opportunityId: string;
  companyId: string;
  contactId?: string | null;
  userId?: string | null;
  type: ActivityType;
  subject?: string | null;
  note?: string | null;
  occurredAt: Date;
  outcome?: ActivityOutcome | null;
  outcomeNote?: string | null;
  responseToActivityId?: string | null;
}

export type UpdateActivityInput = Partial<
  Omit<CreateActivityInput, "opportunityId" | "companyId">
>;

async function requireOpportunityForAccount(opportunityId: string, accountId: string) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, accountId },
  });
  if (!opportunity) {
    throw new NotFoundError("Opportunity", opportunityId);
  }
  return opportunity;
}

async function assertContactForCompany(contactId: string, companyId: string) {
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, companyId },
    omit: { notes: true },
  });
  if (!contact) {
    throw new NotFoundError("Contact", contactId);
  }
}

async function assertUserForAccount(userId: string, accountId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, accountId },
  });
  if (!user) {
    throw new NotFoundError("User", userId);
  }
}

async function assertParentActivity(responseToActivityId: string, accountId: string) {
  const parent = await prisma.activity.findFirst({
    where: { id: responseToActivityId, accountId },
  });
  if (!parent) {
    throw new NotFoundError("Activity", responseToActivityId);
  }
}

export async function listActivities(
  accountId: string,
  opportunityId?: string,
): Promise<Activity[]> {
  const where: Prisma.ActivityWhereInput = {
    accountId,
    ...(opportunityId ? { opportunityId } : {}),
  };
  return prisma.activity.findMany({
    where,
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function listActivitiesByCompany(
  accountId: string,
  companyId: string,
): Promise<Activity[]> {
  return prisma.activity.findMany({
    where: { accountId, companyId },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getActivityById(accountId: string, id: string): Promise<Activity> {
  const row = await prisma.activity.findFirst({
    where: { id, accountId },
  });
  if (!row) {
    throw new NotFoundError("Activity", id);
  }
  return row;
}

export async function createActivity(
  accountId: string,
  input: CreateActivityInput,
): Promise<Activity> {
  const opportunity = await requireOpportunityForAccount(input.opportunityId, accountId);
  if (input.companyId !== opportunity.companyId) {
    throw new NotFoundError("Company", input.companyId);
  }
  if (input.contactId) {
    await assertContactForCompany(input.contactId, opportunity.companyId);
  }
  if (input.userId) {
    await assertUserForAccount(input.userId, accountId);
  }
  if (input.responseToActivityId) {
    await assertParentActivity(input.responseToActivityId, accountId);
  }

  return prisma.activity.create({
    data: {
      accountId,
      opportunityId: opportunity.id,
      companyId: opportunity.companyId,
      contactId: input.contactId ?? null,
      userId: input.userId ?? null,
      type: input.type,
      subject: input.subject ?? null,
      note: input.note ?? null,
      occurredAt: input.occurredAt,
      outcome: input.outcome ?? null,
      outcomeNote: input.outcomeNote ?? null,
      responseToActivityId: input.responseToActivityId ?? null,
    },
  });
}

export async function updateActivity(
  accountId: string,
  id: string,
  input: UpdateActivityInput,
): Promise<Activity> {
  const existing = await getActivityById(accountId, id);

  if (input.contactId) {
    await assertContactForCompany(input.contactId, existing.companyId);
  }
  if (input.userId) {
    await assertUserForAccount(input.userId, accountId);
  }
  if (input.responseToActivityId) {
    await assertParentActivity(input.responseToActivityId, accountId);
  }

  return prisma.activity.update({
    where: { id: existing.id },
    data: {
      ...(input.contactId !== undefined ? { contactId: input.contactId } : {}),
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.occurredAt !== undefined ? { occurredAt: input.occurredAt } : {}),
      ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
      ...(input.outcomeNote !== undefined ? { outcomeNote: input.outcomeNote } : {}),
      ...(input.responseToActivityId !== undefined
        ? { responseToActivityId: input.responseToActivityId }
        : {}),
    },
  });
}

export async function deleteActivity(accountId: string, id: string): Promise<Activity> {
  const existing = await getActivityById(accountId, id);
  return prisma.activity.delete({ where: { id: existing.id } });
}
