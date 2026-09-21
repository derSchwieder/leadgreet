import { describe, expect, it } from "vitest";
import { opportunityDetailPath } from "./path";

describe("opportunityDetailPath", () => {
  it("points to the single opportunity detail route without an account override", () => {
    expect(opportunityDetailPath("opp-42")).toBe("/opportunities/opp-42");
    expect(opportunityDetailPath("opp-42")).not.toContain("accountId");
  });
});
