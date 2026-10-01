import type { CompanyScreeningStatus, CompanyScreeningTrigger, Prisma } from "@prisma/client";
import { assertCompanyScreeningTransition } from "@/lib/screening/status";
import { normalizeScreeningInput } from "@/lib/screening/normalize";
import type { CompanyScreeningResultPayload } from "@/types";
import { prisma } from "./client";
import { ConflictError, NotFoundError } from "./serialize";

const DEFAULT_LIST_LIMIT = 50;

export function isMissingCompanyScreeningTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "P2021" && /CompanyScreening/i.test(candidate.message ?? "")) {
    return true;
  }
  return (
    typeof candidate.message === "string" &&
    /CompanyScreening/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

export type ScreeningView = {
  id: string;
  status: CompanyScreeningStatus;
  triggeredBy: CompanyScreeningTrigger;
  inputName: string;
  inputDomain: string | null;
  companyId: string | null;
  company: { id: string; name: string; website: string | null } | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  result: CompanyScreeningResultPayload | null;
};

const screeningInclude = {
  company: { select: { id: true, name: true, website: true } },
  result: true,
} as const;

type ScreeningRow = {
  id: string;
  status: CompanyScreeningStatus;
  triggeredBy: CompanyScreeningTrigger;
  inputName: string;
  inputDomain: string | null;
  companyId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  company: { id: string; name: string; website: string | null } | null;
  result: { payload: Prisma.JsonValue } | null;
};

function serializePayload(payload: Prisma.JsonValue): CompanyScreeningResultPayload | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  return payload as CompanyScreeningResultPayload;
}

function serializeScreening(row: ScreeningRow): ScreeningView {
  return {
    id: row.id,
    status: row.status,
    triggeredBy: row.triggeredBy,
    inputName: row.inputName,
    inputDomain: row.inputDomain,
    companyId: row.companyId,
    company: row.company,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    result: row.result ? serializePayload(row.result.payload) : null,
  };
}

export async function listCompanyScreenings(
  accountId: string,
  filters?: { status?: CompanyScreeningStatus; companyId?: string; limit?: number },
): Promise<ScreeningView[]> {
  const rows = await prisma.companyScreening.findMany({
    where: {
      accountId,
      status: filters?.status,
      companyId: filters?.companyId,
    },
    include: screeningInclude,
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? DEFAULT_LIST_LIMIT,
  });
  return rows.map(serializeScreening);
}

export async function getCompanyScreeningById(
  accountId: string,
  id: string,
): Promise<ScreeningView> {
  const row = await prisma.companyScreening.findFirst({
    where: { id, accountId },
    include: screeningInclude,
  });
  if (!row) {
    throw new NotFoundError("CompanyScreening", id);
  }
  return serializeScreening(row);
}

export async function createManualCompanyScreening(
  accountId: string,
  input: { inputName: string; inputDomain?: string | null; companyId?: string | null },
): Promise<ScreeningView> {
  const normalized = normalizeScreeningInput({
    name: input.inputName,
    domain: input.inputDomain,
  });

  if (input.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
      select: { id: true },
    });
    if (!company) {
      throw new NotFoundError("Company", input.companyId);
    }
  }

  const row = await prisma.companyScreening.create({
    data: {
      accountId,
      inputName: normalized.name,
      inputDomain: normalized.domain,
      companyId: input.companyId ?? null,
      status: "QUEUED",
      triggeredBy: "MANUAL",
    },
    include: screeningInclude,
  });
  return serializeScreening(row);
}

export async function getLatestCompanyScreening(
  accountId: string,
  companyId: string,
): Promise<ScreeningView | null> {
  const row = await prisma.companyScreening.findFirst({
    where: { accountId, companyId },
    include: screeningInclude,
    orderBy: { createdAt: "desc" },
  });
  return row ? serializeScreening(row) : null;
}

export async function claimCompanyScreeningRun(
  accountId: string,
  id: string,
): Promise<ScreeningView> {
  const existing = await getCompanyScreeningById(accountId, id);
  assertCompanyScreeningTransition(existing.status, "RUNNING");
  const moved = await prisma.companyScreening.updateMany({
    where: { id, accountId, status: existing.status },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      completedAt: null,
    },
  });
  if (moved.count === 0) {
    throw new ConflictError("CompanyScreening is already RUNNING");
  }
  return getCompanyScreeningById(accountId, id);
}

export async function completeCompanyScreening(
  accountId: string,
  id: string,
  input: { companyId: string | null; payload: CompanyScreeningResultPayload },
): Promise<ScreeningView> {
  const existing = await getCompanyScreeningById(accountId, id);
  assertCompanyScreeningTransition(existing.status, "COMPLETED");

  await prisma.$transaction(async (tx) => {
    const moved = await tx.companyScreening.updateMany({
      where: { id, accountId, status: "RUNNING" },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        companyId: input.companyId ?? existing.companyId,
      },
    });
    if (moved.count === 0) {
      throw new ConflictError("CompanyScreening cannot move from RUNNING to COMPLETED");
    }
    await tx.companyScreeningResult.upsert({
      where: { screeningId: id },
      create: {
        screeningId: id,
        payload: input.payload as Prisma.InputJsonValue,
      },
      update: {
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  });

  return getCompanyScreeningById(accountId, id);
}

export async function failCompanyScreening(
  accountId: string,
  id: string,
  error?: { code: string; message: string },
): Promise<ScreeningView> {
  const existing = await getCompanyScreeningById(accountId, id);
  assertCompanyScreeningTransition(existing.status, "FAILED");
  await prisma.$transaction(async (tx) => {
    const moved = await tx.companyScreening.updateMany({
      where: { id, accountId, status: existing.status },
      data: { status: "FAILED" },
    });
    if (moved.count === 0) {
      throw new ConflictError("CompanyScreening cannot move to FAILED");
    }
    if (error) {
      await tx.companyScreeningResult.upsert({
        where: { screeningId: id },
        create: {
          screeningId: id,
          payload: { error } as Prisma.InputJsonValue,
        },
        update: {
          payload: { error } as Prisma.InputJsonValue,
        },
      });
    }
  });
  return getCompanyScreeningById(accountId, id);
}