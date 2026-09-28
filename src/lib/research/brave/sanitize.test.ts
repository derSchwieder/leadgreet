import { describe, expect, it } from "vitest";
import { sanitizeSearchQuery } from "./sanitize";

describe("sanitizeSearchQuery", () => {
  it("drops a placeholder person name and keeps the company plus role", () => {
    expect(sanitizeSearchQuery("DATEV Max Mustermann CIO")).toBe("DATEV CIO");
  });

  it("removes emails and phone numbers", () => {
    expect(sanitizeSearchQuery("DATEV max@example.com +49 911 123456")).toBe("DATEV");
  });

  it("keeps a plain company name", () => {
    expect(sanitizeSearchQuery("DATEV")).toBe("DATEV");
    expect(sanitizeSearchQuery("SAP SE")).toBe("SAP SE");
  });

  it("drops a titlecase given and family name after the company token", () => {
    expect(sanitizeSearchQuery("DATEV Erika Muster CIO")).toBe("DATEV CIO");
  });
});
