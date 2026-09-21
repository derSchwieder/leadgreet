import { describe, expect, it } from "vitest";
import { contactDisplayLabel } from "./display";

describe("contactDisplayLabel", () => {
  it("formats name and role", () => {
    expect(contactDisplayLabel({ fullName: "Herr Meier", role: "CIO" })).toBe("Herr Meier · CIO");
  });
});
