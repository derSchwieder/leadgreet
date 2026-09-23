import { accountIcpSchema } from "@/lib/validation";
import type { IcpProfile } from "./match";

export const ICP_REVENUE_MILLION = 1_000_000;

export type StoredAccountIcp = {
  industries: string[];
  countries: string[];
  minEmployees: number | null;
  minRevenue: number | null;
};

export const EMPTY_ACCOUNT_ICP: StoredAccountIcp = {
  industries: [],
  countries: [],
  minEmployees: null,
  minRevenue: null,
};

export function parseAccountIcp(value: unknown): StoredAccountIcp {
  const parsed = accountIcpSchema.safeParse(value ?? EMPTY_ACCOUNT_ICP);
  if (!parsed.success) return { ...EMPTY_ACCOUNT_ICP };
  return normalizeAccountIcp(parsed.data);
}

export function toIcpProfile(icp: StoredAccountIcp): IcpProfile {
  return {
    industries: icp.industries,
    countries: icp.countries,
    employees: icp.minEmployees == null ? undefined : { min: icp.minEmployees },
    revenue: icp.minRevenue == null ? undefined : { min: icp.minRevenue },
  };
}

export function millionToEuros(millions: number): number {
  return millions * ICP_REVENUE_MILLION;
}

export function eurosToMillionInput(euros: number | null): string {
  if (euros == null) return "";
  const millions = euros / ICP_REVENUE_MILLION;
  return Number.isInteger(millions) ? String(millions) : String(millions);
}

export function parseEmployeesDraft(value: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (!/^\d+$/.test(trimmed)) return { ok: false };
  const amount = Number(trimmed);
  if (!Number.isInteger(amount) || amount < 0) return { ok: false };
  return { ok: true, value: amount };
}

export function parseMillionDraft(value: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return { ok: true, value: null };
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return { ok: false };
  const millions = Number(trimmed);
  if (!Number.isFinite(millions) || millions < 0) return { ok: false };
  return { ok: true, value: millionToEuros(millions) };
}

function normalizeAccountIcp(icp: StoredAccountIcp): StoredAccountIcp {
  return {
    industries: uniquePresent(icp.industries),
    countries: uniquePresent(icp.countries),
    minEmployees: icp.minEmployees,
    minRevenue: icp.minRevenue,
  };
}

function uniquePresent(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}
