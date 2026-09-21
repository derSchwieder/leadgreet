import { describe, expect, it } from "vitest";
import {
  filterByNameOrCity,
  filterOpportunitiesBySearch,
  filterRadarPointsBySearch,
  matchesNameOrCity,
  normalizeSearchQuery,
} from "./entity-search";

const companies = [
  { id: "siemens", name: "Siemens AG", city: "München" },
  { id: "datev", name: "DATEV eG", city: "Nürnberg" },
  { id: "festo", name: "Festo SE & Co. KG", city: "Esslingen" },
  { id: "bmw", name: "BMW AG", city: "München" },
];

const opportunities = [
  { id: "o1", title: "Siemens AG — KI-Agent", company: { name: "Siemens AG" } },
  { id: "o2", title: "DATEV eG — Prozessautomatisierung", company: { name: "DATEV eG" } },
  { id: "o3", title: "BMW AG — Software-Modernisierung", company: { name: "BMW AG" } },
];

const radarPoints = [
  { companyId: "seed", name: "Schaeffler", city: "Herzogenaurach", greet: 82 },
  { companyId: "siemens", name: "Siemens AG", city: "München", greet: 57 },
  { companyId: "datev", name: "DATEV eG", city: "Nürnberg", greet: 54 },
  { companyId: "bmw", name: "BMW AG", city: "München", greet: 54 },
];

describe("normalizeSearchQuery", () => {
  it("trims and lowercases with German locale", () => {
    expect(normalizeSearchQuery("  NÜRN  ")).toBe("nürn");
  });
});

describe("Firmensuche nach Name", () => {
  it("finds a company by partial name", () => {
    const matches = filterByNameOrCity(companies, "siemens");
    expect(matches.map((item) => item.id)).toEqual(["siemens"]);
    expect(matchesNameOrCity("siemens", "Siemens AG", "München")).toBe(true);
  });
});

describe("Suche nach Stadt", () => {
  it("finds companies by city", () => {
    const matches = filterByNameOrCity(companies, "nürn");
    expect(matches.map((item) => item.id)).toEqual(["datev"]);
  });

  it("returns multiple matches for a shared city", () => {
    const matches = filterByNameOrCity(companies, "München");
    expect(matches.map((item) => item.id)).toEqual(["siemens", "bmw"]);
  });
});

describe("keine Treffer", () => {
  it("returns an empty list when nothing matches", () => {
    expect(filterByNameOrCity(companies, "Atlantis")).toEqual([]);
    expect(filterOpportunitiesBySearch(opportunities, "Atlantis")).toEqual([]);
    expect(filterRadarPointsBySearch(radarPoints, "Atlantis", 0)).toEqual([]);
  });
});

describe("mehrere Treffer", () => {
  it("keeps every company whose name or city contains the query", () => {
    const matches = filterByNameOrCity(companies, "e");
    expect(matches.length).toBeGreaterThan(1);
  });

  it("matches opportunities by company name or title", () => {
    expect(filterOpportunitiesBySearch(opportunities, "siemens").map((item) => item.id)).toEqual([
      "o1",
    ]);
    expect(filterOpportunitiesBySearch(opportunities, "Software").map((item) => item.id)).toEqual([
      "o3",
    ]);
  });
});

describe("Suche im Radar kombiniert mit Greet-Schwelle", () => {
  it("does not surface a name match below the threshold", () => {
    const matches = filterRadarPointsBySearch(radarPoints, "Siemens", 70);
    expect(matches.map((item) => item.companyId)).toEqual([]);
  });

  it("keeps a name match that is still above the threshold", () => {
    const matches = filterRadarPointsBySearch(radarPoints, "Schaeffler", 70);
    expect(matches.map((item) => item.companyId)).toEqual(["seed"]);
  });

  it("applies search after the threshold, not instead of it", () => {
    const above = filterRadarPointsBySearch(radarPoints, "", 50);
    const searched = filterRadarPointsBySearch(radarPoints, "München", 50);
    expect(above.map((item) => item.companyId)).toEqual(["seed", "siemens", "datev", "bmw"]);
    expect(searched.map((item) => item.companyId)).toEqual(["siemens", "bmw"]);
  });
});

describe("Reset der Suche", () => {
  it("returns the unfiltered list when the query is cleared", () => {
    const filtered = filterByNameOrCity(companies, "Siemens");
    expect(filtered).toHaveLength(1);
    expect(filterByNameOrCity(companies, "   ")).toEqual(companies);
    expect(filterRadarPointsBySearch(radarPoints, "", 0)).toHaveLength(radarPoints.length);
  });
});
