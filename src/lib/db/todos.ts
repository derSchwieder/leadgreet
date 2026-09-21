import type { SalesTodo, SalesTodoStatus } from "@prisma/client";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export interface CreateSalesTodoInput {
  opportunityId: string;
  companyId: string;
  title: string;
  dueAt: Date;
  contactId?: string | null;
  relatedActivityId?: string | null;
}

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

async function assertRelatedActivity(
  relatedActivityId: string,
  accountId: string,
  opportunityId: string,
) {
  const activity = await prisma.activity.findFirst({
    where: { id: relatedActivityId, accountId, opportunityId },
  });
  if (!activity) {
    throw new NotFoundError("Activity", relatedActivityId);
  }
}

export async function listSalesTodos(
  accountId: string,
  opportunityId?: string,
): Promise<SalesTodo[]> {
  if (opportunityId) {
    await requireOpportunityForAccount(opportunityId, accountId);
  }

  return prisma.salesTodo.findMany({
    where: {
      accountId,
      ...(opportunityId ? { opportunityId } : {}),
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "asc" }],
  });
}

export async function getSalesTodoById(accountId: string, id: string): Promise<SalesTodo> {
  const row = await prisma.salesTodo.findFirst({
    where: { id, accountId },
  });
  if (!row) {
    throw new NotFoundError("SalesTodo", id);
  }
  return row;
}

export async function createSalesTodo(
  accountId: string,
  input: CreateSalesTodoInput,
): Promise<SalesTodo> {
  const opportunity = await requireOpportunityForAccount(input.opportunityId, accountId);
  if (input.companyId !== opportunity.companyId) {
    throw new NotFoundError("Company", input.companyId);
  }
  if (input.contactId) {
    await assertContactForCompany(input.contactId, opportunity.companyId);
  }
  if (input.relatedActivityId) {
    await assertRelatedActivity(input.relatedActivityId, accountId, opportunity.id);
  }

  return prisma.salesTodo.create({
    data: {
      accountId,
      opportunityId: opportunity.id,
      companyId: opportunity.companyId,
      contactId: input.contactId ?? null,
      title: input.title,
      dueAt: input.dueAt,
      status: "OPEN",
      completedAt: null,
      relatedActivityId: input.relatedActivityId ?? null,
    },
  });
}

export async function completeSalesTodo(accountId: string, id: string): Promise<SalesTodo> {
  const existing = await getSalesTodoById(accountId, id);
  if (existing.status === "DONE") {
    return existing;
  }

  return prisma.salesTodo.update({
    where: { id: existing.id },
    data: {
      status: "DONE" satisfies SalesTodoStatus,
      completedAt: new Date(),
    },
  });
}

export function isMissingSalesTodoTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "P2021" && /SalesTodo/i.test(candidate.message ?? "")) return true;
  return (
    typeof candidate.message === "string" &&
    /SalesTodo/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}
