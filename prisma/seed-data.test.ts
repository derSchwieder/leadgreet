import { describe, expect, it } from "vitest";
import {
  SEED_COMPANY_LOCATIONS,
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

  it("assigns a public HQ city and country to every seed company", () => {
    expect(Object.keys(SEED_COMPANY_LOCATIONS)).toEqual([...SEED_COMPANY_NAMES]);
    expect(SEED_COMPANY_LOCATIONS).toEqual({
      "VIA optronics": { city: "Nürnberg", country: "Deutschland" },
      Goldhofer: { city: "Memmingen", country: "Deutschland" },
      Schaeffler: { city: "Herzogenaurach", country: "Deutschland" },
      "ARS Altmann": { city: "Wolnzach", country: "Deutschland" },
      "SAF-HOLLAND": { city: "Bessenbach", country: "Deutschland" },
      SKZ: { city: "Würzburg", country: "Deutschland" },
      "EM Gerätebau": { city: "Mammendorf", country: "Deutschland" },
      Climaline: { city: "Würzburg", country: "Deutschland" },
      "Authentic Style": { city: "Wunstorf", country: "Deutschland" },
      WIKA: { city: "Klingenberg", country: "Deutschland" },
    });
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
