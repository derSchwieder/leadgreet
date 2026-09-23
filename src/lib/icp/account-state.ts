import type { AccountCompanyStatus } from "@/types";

export const ACCOUNT_COMPANY_EXCLUDED_STATUSES: readonly AccountCompanyStatus[] = [
  "NOT_RELEVANT",
  "DECLINED",
] as const;

export function isExcludedAccountCompanyStatus(
  status: AccountCompanyStatus | null | undefined,
): boolean {
  return status === "NOT_RELEVANT" || status === "DECLINED";
}

export function excludeCompanyIds<T extends { id?: string; companyId?: string }>(
  items: readonly T[],
  excluded: ReadonlySet<string>,
): T[] {
  if (excluded.size === 0) return [...items];
  return items.filter((item) => {
    const id = item.companyId ?? item.id;
    return id == null || !excluded.has(id);
  });
}
