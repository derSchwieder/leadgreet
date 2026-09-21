import { describe, expect, it } from "vitest";
import { CLEARED_GEO_CACHE, shouldClearGeoCache } from "./invalidate";

describe("geo cache invalidation", () => {
  const current = { city: "Nürnberg", country: "Deutschland" };

  it("clears when city changes", () => {
    expect(shouldClearGeoCache(current, { city: "Memmingen" })).toBe(true);
  });

  it("clears when country changes", () => {
    expect(shouldClearGeoCache(current, { country: "Österreich" })).toBe(true);
  });

  it("keeps the cache when another field would change and location is omitted", () => {
    expect(shouldClearGeoCache(current, {})).toBe(false);
  });

  it("keeps the cache when city and country stay the same", () => {
    expect(shouldClearGeoCache(current, { city: "Nürnberg", country: "Deutschland" })).toBe(
      false,
    );
    expect(shouldClearGeoCache(current, { city: "  Nürnberg  " })).toBe(false);
  });

  it("exposes null geo fields for a write", () => {
    expect(CLEARED_GEO_CACHE).toEqual({
      latitude: null,
      longitude: null,
      geocodedAt: null,
    });
  });
});
