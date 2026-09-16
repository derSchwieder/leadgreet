import { describe, expect, it } from "vitest";
import {
  SEED_COMPANY_NAMES,
  SEED_CONTACTS,
  SEED_SIGNALS,
  SEED_SOURCES,
} from "./seed-data";

describe("seed data integrity", () => {
  it("covers the ten briefed company names and nothing else", () => {
    expect([...SEED_COMPANY_NAMES]).toEqual([
      "VIA optronics",
      "Goldhofer",
      "Schaeffler",
      "ARS Altmann",
      "SAF-HOLLAND",
      "SKZ",
      "EM Gerätebau",
      "Climaline",
      "Authentic Style",
      "WIKA",
    ]);
  });

  it("references only known companies and sources", () => {
    const companies = new Set<string>(SEED_COMPANY_NAMES);
    const sources = new Set(SEED_SOURCES.map((source) => source.key));

    for (const signal of SEED_SIGNALS) {
      expect(companies.has(signal.companyName)).toBe(true);
      expect(sources.has(signal.sourceKey)).toBe(true);
      expect(signal.title.startsWith("[DEMO]")).toBe(true);
      expect(signal.description).toContain("DEMO");
    }

    for (const contact of SEED_CONTACTS) {
      expect(companies.has(contact.companyName)).toBe(true);
      expect(contact.firstName).toBe("Seed");
    }

    expect(SEED_CONTACTS).toHaveLength(SEED_COMPANY_NAMES.length);
  });
});
