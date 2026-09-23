import type { AccountCompanyStatus } from "@/types";
import { isExcludedAccountCompanyStatus } from "@/lib/icp";
import { prisma } from "./client";
import { getCompanyById } from "./companies";

export type AccountCompanyStateView = {
  companyId: string;
  status: AccountCompanyStatus | null;
  note: string | null;
};

export function isMissingAccountCompanyStateTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "P2021" && /AccountCompanyState/i.test(candidate.message ?? "")) {
    return true;
  }
  return (
    typeof candidate.message === "string" &&
    /AccountCompanyState/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

export async function listExcludedCompanyIds(accountId: string): Promise<Set<string>> {
  try {
    const rows = await prisma.accountCompanyState.findMany({
      where: {
        accountId,
        status: { in: ["NOT_RELEVANT", "DECLINED"] },
      },
      select: { companyId: true },
    });
    return new Set(rows.map((row) => row.companyId));
  } catch (error) {
    if (isMissingAccountCompanyStateTable(error)) return new Set();
    throw error;
  }
}

export async function getAccountCompanyState(
  accountId: string,
  companyId: string,
): Promise<AccountCompanyStateView> {
  try {
    const row = await prisma.accountCompanyState.findUnique({
      where: { accountId_companyId: { accountId, companyId } },
      select: { companyId: true, status: true, note: true },
    });
    if (!row) {
      return { companyId, status: null, note: null };
    }
    return {
      companyId: row.companyId,
      status: isExcludedAccountCompanyStatus(row.status) ? row.status : null,
      note: row.note,
    };
  } catch (error) {
    if (isMissingAccountCompanyStateTable(error)) {
      return { companyId, status: null, note: null };
    }
    throw error;
  }
}

export async function setAccountCompanyState(
  accountId: string,
  companyId: string,
  status: AccountCompanyStatus | null,
  note?: string | null,
): Promise<AccountCompanyStateView> {
  await getCompanyById(companyId);

  if (status == null) {
    try {
      await prisma.accountCompanyState.deleteMany({
        where: { accountId, companyId },
      });
    } catch (error) {
      if (isMissingAccountCompanyStateTable(error)) {
        return { companyId, status: null, note: null };
      }
      throw error;
    }
    return { companyId, status: null, note: null };
  }

  const row = await prisma.accountCompanyState.upsert({
    where: { accountId_companyId: { accountId, companyId } },
    create: {
      accountId,
      companyId,
      status,
      note: note?.trim() || null,
    },
    update: {
      status,
      note: note === undefined ? undefined : note?.trim() || null,
    },
    select: { companyId: true, status: true, note: true },
  });

  return {
    companyId: row.companyId,
    status: row.status,
    note: row.note,
  };
}
