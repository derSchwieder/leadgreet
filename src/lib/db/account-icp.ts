import { Prisma } from "@prisma/client";
import { accountIcpSchema } from "@/lib/validation";
import { parseAccountIcp, type StoredAccountIcp } from "@/lib/icp/account";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export function isMissingAccountIcpColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; meta?: { column?: string }; message?: string };
  if (candidate.code === "P2022") {
    if (candidate.meta?.column) return candidate.meta.column === "icp";
    return typeof candidate.message === "string" && /icp/i.test(candidate.message);
  }
  return (
    typeof candidate.message === "string" &&
    /Account.*icp|column .*icp/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

export async function getAccountIcp(accountId: string): Promise<StoredAccountIcp> {
  try {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { icp: true },
    });
    if (!account) {
      throw new NotFoundError("Account", accountId);
    }
    return parseAccountIcp(account.icp);
  } catch (error) {
    if (isMissingAccountIcpColumn(error)) return parseAccountIcp(null);
    throw error;
  }
}

export async function saveAccountIcp(
  accountId: string,
  icp: StoredAccountIcp,
): Promise<StoredAccountIcp> {
  const stored = parseAccountIcp(accountIcpSchema.parse(icp));
  const account = await prisma.account.update({
    where: { id: accountId },
    data: { icp: stored as Prisma.InputJsonValue },
    select: { icp: true },
  });
  return parseAccountIcp(account.icp);
}
