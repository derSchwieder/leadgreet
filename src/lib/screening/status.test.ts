import { describe, expect, it } from "vitest";
import { ConflictError } from "@/lib/db/serialize";
import {
  assertCompanyScreeningTransition,
  canTransitionCompanyScreening,
} from "./status";

describe("CompanyScreening transitions", () => {
  it("allows QUEUED to RUNNING or FAILED", () => {
    expect(canTransitionCompanyScreening("QUEUED", "RUNNING")).toBe(true);
    expect(canTransitionCompanyScreening("QUEUED", "FAILED")).toBe(true);
    expect(canTransitionCompanyScreening("QUEUED", "COMPLETED")).toBe(false);
  });

  it("allows RUNNING to COMPLETED or FAILED", () => {
    expect(canTransitionCompanyScreening("RUNNING", "COMPLETED")).toBe(true);
    expect(canTransitionCompanyScreening("RUNNING", "FAILED")).toBe(true);
    expect(canTransitionCompanyScreening("RUNNING", "QUEUED")).toBe(false);
  });

  it("does not reset COMPLETED and does not retry FAILED yet", () => {
    expect(canTransitionCompanyScreening("COMPLETED", "QUEUED")).toBe(false);
    expect(canTransitionCompanyScreening("COMPLETED", "RUNNING")).toBe(false);
    expect(canTransitionCompanyScreening("FAILED", "QUEUED")).toBe(false);
    expect(canTransitionCompanyScreening("FAILED", "RUNNING")).toBe(false);
    expect(() => assertCompanyScreeningTransition("COMPLETED", "RUNNING")).toThrow(
      ConflictError,
    );
  });
});
