import { describe, expect, it } from "vitest";
import { SEED_COMPANY_LOCATIONS } from "../../../prisma/seed-data";
import { lookupDemoCoordinates } from "./demo-coordinates";
import { offsetOverlappingRadarPoints } from "./display-offset";
import { buildRadarPoints } from "./points";
import { RADAR_POINT_FIELDS, type RadarCandidate } from "./types";

function candidate(overrides: Partial<RadarCandidate> = {}): RadarCandidate {
  return {
    companyId: "co-1",
    name: "VIA optronics",
    city: "Nürnberg",
    country: "Deutschland",
    greet: 82,
    signalTitle: "[DEMO] Display expansion",
    ...overrides,
  };
}

describe("buildRadarPoints", () => {
  it("returns only the fields the map needs", () => {
    const [point] = buildRadarPoints([candidate()]);
    expect(point).toBeDefined();
    expect(Object.keys(point!).sort()).toEqual([...RADAR_POINT_FIELDS].sort());
    expect(point).not.toHaveProperty("accountId");
  });

  it("uses the stored greet value without recomputing it", () => {
    const [point] = buildRadarPoints([candidate({ greet: 73 })]);
    expect(point?.greet).toBe(73);
  });

  it("passes through a company website and treats a blank value as absent", () => {
    const [withSite] = buildRadarPoints([candidate({ website: "https://example.com" })]);
    const [blank] = buildRadarPoints([candidate({ website: "  " })]);
    const [missing] = buildRadarPoints([candidate()]);
    expect(withSite?.website).toBe("https://example.com");
    expect(blank?.website).toBeNull();
    expect(missing?.website).toBeNull();
  });

  it("omits a company that has no demo city coordinate", () => {
    const points = buildRadarPoints([
      candidate(),
      candidate({
        companyId: "co-missing",
        name: "Unknown Co",
        city: "Atlantis",
        country: "Deutschland",
        greet: 90,
      }),
    ]);
    expect(points).toHaveLength(1);
    expect(points[0]?.companyId).toBe("co-1");
    expect(lookupDemoCoordinates("Atlantis")).toBeNull();
  });

  it("omits a company without city or country", () => {
    expect(
      buildRadarPoints([
        candidate({ city: null, country: "Deutschland" }),
        candidate({ companyId: "co-2", city: "Nürnberg", country: null }),
      ]),
    ).toEqual([]);
  });

  it("has a city-center coordinate for every seed company city", () => {
    for (const location of Object.values(SEED_COMPANY_LOCATIONS)) {
      expect(lookupDemoCoordinates(location.city)).not.toBeNull();
    }
  });
});

describe("offsetOverlappingRadarPoints", () => {
  const nuremberg = {
    companyId: "a",
    name: "A",
    city: "Nürnberg",
    country: "Deutschland",
    latitude: 49.4521,
    longitude: 11.0767,
    greet: 80,
    signalTitle: null,
    website: null,
  };
  const wuerzburgA = {
    ...nuremberg,
    companyId: "skz",
    name: "SKZ",
    city: "Würzburg",
    latitude: 49.7944,
    longitude: 9.9294,
  };
  const wuerzburgB = {
    ...wuerzburgA,
    companyId: "clima",
    name: "Climaline",
  };
  const herzogenaurach = {
    ...nuremberg,
    companyId: "schaeffler",
    name: "Schaeffler",
    city: "Herzogenaurach",
    latitude: 49.5675,
    longitude: 10.8856,
  };
  const wunstorf = {
    ...nuremberg,
    companyId: "authentic",
    name: "Authentic Style",
    city: "Wunstorf",
    latitude: 52.4236,
    longitude: 9.4294,
  };

  it("keeps a single city centroid unchanged and spreads shared cities", () => {
    const result = offsetOverlappingRadarPoints([nuremberg, wuerzburgA, wuerzburgB]);
    const kept = result.find((point) => point.companyId === "a");
    const first = result.find((point) => point.companyId === "skz");
    const second = result.find((point) => point.companyId === "clima");

    expect(kept?.latitude).toBe(49.4521);
    expect(kept?.longitude).toBe(11.0767);
    expect(first?.latitude).not.toBe(second?.latitude);
    expect(`${first?.latitude},${first?.longitude}`).not.toBe(
      `${second?.latitude},${second?.longitude}`,
    );
  });

  it("does not mutate the original radar points", () => {
    const originalLat = wuerzburgA.latitude;
    const originalLng = wuerzburgA.longitude;
    offsetOverlappingRadarPoints([wuerzburgA, wuerzburgB]);
    expect(wuerzburgA.latitude).toBe(originalLat);
    expect(wuerzburgA.longitude).toBe(originalLng);
  });

  it("nudges nearby distinct cities apart while keeping their relative region", () => {
    const result = offsetOverlappingRadarPoints([nuremberg, herzogenaurach]);
    const nuernberg = result.find((point) => point.companyId === "a");
    const herzogen = result.find((point) => point.companyId === "schaeffler");

    expect(herzogen!.latitude).toBeGreaterThan(nuernberg!.latitude);
    expect(herzogen!.longitude).toBeLessThan(nuernberg!.longitude);
    expect(nuernberg!.latitude).not.toBe(nuremberg.latitude);
    expect(herzogen!.latitude).not.toBe(herzogenaurach.latitude);
  });

  it("leaves distant cities on their original coordinates", () => {
    const result = offsetOverlappingRadarPoints([nuremberg, wunstorf]);
    const north = result.find((point) => point.companyId === "authentic");
    const south = result.find((point) => point.companyId === "a");

    expect(south).toEqual(nuremberg);
    expect(north).toEqual(wunstorf);
  });
});
