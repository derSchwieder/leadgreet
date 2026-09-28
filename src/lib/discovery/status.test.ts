import { describe, expect, it } from "vitest";
import { ConflictError } from "@/lib/db/serialize";
import {
  assertUnresolvedSignalTransition,
  canTransitionUnresolvedSignal,
} from "./status";

describe("UnresolvedSignal transitions", () => {
  it("allows NEW to REVIEWED, DISMISSED, and RESOLVED", () => {
    expect(canTransitionUnresolvedSignal("NEW", "REVIEWED")).toBe(true);
    expect(canTransitionUnresolvedSignal("NEW", "DISMISSED")).toBe(true);
    expect(canTransitionUnresolvedSignal("NEW", "RESOLVED")).toBe(true);
  });

  it("allows REVIEWED to RESOLVED and DISMISSED", () => {
    expect(canTransitionUnresolvedSignal("REVIEWED", "RESOLVED")).toBe(true);
    expect(canTransitionUnresolvedSignal("REVIEWED", "DISMISSED")).toBe(true);
    expect(canTransitionUnresolvedSignal("REVIEWED", "NEW")).toBe(false);
  });

  it("does not reopen DISMISSED or RESOLVED", () => {
    expect(canTransitionUnresolvedSignal("DISMISSED", "NEW")).toBe(false);
    expect(canTransitionUnresolvedSignal("DISMISSED", "RESOLVED")).toBe(false);
    expect(canTransitionUnresolvedSignal("RESOLVED", "NEW")).toBe(false);
    expect(canTransitionUnresolvedSignal("RESOLVED", "REVIEWED")).toBe(false);
    expect(() => assertUnresolvedSignalTransition("RESOLVED", "REVIEWED")).toThrow(
      ConflictError,
    );
    expect(() => assertUnresolvedSignalTransition("DISMISSED", "NEW")).toThrow(ConflictError);
  });
});
