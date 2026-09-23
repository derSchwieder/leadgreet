import { Prisma } from "@prisma/client";
import { accountIcpSchema } from "@/lib/validation";
import { parseAccountIcp, storedIcpFromRadarProfile, type StoredAccountIcp } from "@/lib/icp";
import { prisma } from "./client";
import { listRadarProfiles, upsertDefaultRadarProfile } from "./radar-profiles";
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
    const profiles = await listRadarProfiles(accountId);
    if (profiles[0]) {
      return parseAccountIcp(storedIcpFromRadarProfile(profiles[0]));
    }
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
  await upsertDefaultRadarProfile(accountId, stored);
  return parseAccountIcp(account.icp);
}
