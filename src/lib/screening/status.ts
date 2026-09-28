import type { CompanyScreeningStatus } from "@/types";
import { ConflictError } from "@/lib/db/serialize";

const ALLOWED: Record<CompanyScreeningStatus, readonly CompanyScreeningStatus[]> = {
  QUEUED: ["RUNNING", "FAILED"],
  RUNNING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: [],
};

export function canTransitionCompanyScreening(
  from: CompanyScreeningStatus,
  to: CompanyScreeningStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

export function assertCompanyScreeningTransition(
  from: CompanyScreeningStatus,
  to: CompanyScreeningStatus,
): void {
  if (from === to) {
    throw new ConflictError(`CompanyScreening is already ${from}`);
  }
  if (!canTransitionCompanyScreening(from, to)) {
    throw new ConflictError(`CompanyScreening cannot move from ${from} to ${to}`);
  }
}
