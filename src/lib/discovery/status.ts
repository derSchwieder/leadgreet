import type { UnresolvedSignalStatus } from "@/types";
import { ConflictError } from "@/lib/db/serialize";

const ALLOWED: Record<UnresolvedSignalStatus, readonly UnresolvedSignalStatus[]> = {
  NEW: ["REVIEWED", "DISMISSED", "RESOLVED"],
  REVIEWED: ["RESOLVED", "DISMISSED"],
  DISMISSED: [],
  RESOLVED: [],
};

export function canTransitionUnresolvedSignal(
  from: UnresolvedSignalStatus,
  to: UnresolvedSignalStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

export function assertUnresolvedSignalTransition(
  from: UnresolvedSignalStatus,
  to: UnresolvedSignalStatus,
): void {
  if (from === to) {
    throw new ConflictError(`UnresolvedSignal is already ${from}`);
  }
  if (!canTransitionUnresolvedSignal(from, to)) {
    throw new ConflictError(`UnresolvedSignal cannot move from ${from} to ${to}`);
  }
}
