import { describe, expect, it, vi } from "vitest";
import { decideGeocode } from "./decide";
import { geocodeCompany } from "./service";
import { GeocodingError, type CompanyGeoState, type GeocodingProvider } from "./types";
import { geocodingApiKeyFromEnv, UnconfiguredGeocodingProvider } from "./unconfigured";

const NOW = new Date("2026-09-17T15:00:00.000Z");

function company(overrides: Partial<CompanyGeoState> = {}): CompanyGeoState {
  return {
    city: "Nürnberg",
    country: "Deutschland",
    latitude: null,
    longitude: null,
    geocodedAt: null,
    ...overrides,
  };
}

function mockProvider(
  impl: GeocodingProvider["geocodeCityCountry"] = async () => ({
    latitude: 49.4521,
    longitude: 11.0767,
  }),
): GeocodingProvider & { geocodeCityCountry: ReturnType<typeof vi.fn> } {
  return {
    name: "mock",
    geocodeCityCountry: vi.fn(impl),
  };
}

describe("geocoding service", () => {
  it("passes city and country to the provider", async () => {
    const provider = mockProvider();
    await geocodeCompany(company({ city: "Memmingen", country: "Deutschland" }), provider, NOW);

    expect(provider.geocodeCityCountry).toHaveBeenCalledOnce();
    expect(provider.geocodeCityCountry).toHaveBeenCalledWith("Memmingen", "Deutschland");
  });

  it("returns latitude and longitude from a successful provider response", async () => {
    const provider = mockProvider(async () => ({ latitude: 49.9861, longitude: 10.1269 }));
    const result = await geocodeCompany(company({ city: "Klingenberg", country: "Deutschland" }), provider, NOW);

    expect(result).toMatchObject({
      status: "geocoded",
      latitude: 49.9861,
      longitude: 10.1269,
    });
  });

  it("sets geocodedAt on a successful geocode", async () => {
    const result = await geocodeCompany(company(), mockProvider(), NOW);

    expect(result.status).toBe("geocoded");
    if (result.status === "geocoded") {
      expect(result.geocodedAt).toEqual(NOW);
    }
  });

  it("does not geocode when city or country is missing", async () => {
    const provider = mockProvider();

    const missingCity = await geocodeCompany(company({ city: "  ", country: "Deutschland" }), provider, NOW);
    const missingCountry = await geocodeCompany(company({ city: "Nürnberg", country: null }), provider, NOW);

    expect(missingCity).toMatchObject({ status: "skipped", reason: "missing_city_or_country" });
    expect(missingCountry).toMatchObject({ status: "skipped", reason: "missing_city_or_country" });
    expect(provider.geocodeCityCountry).not.toHaveBeenCalled();
  });

  it("does not store coordinates when the provider fails", async () => {
    const provider = mockProvider(async () => {
      throw new GeocodingError("upstream unavailable");
    });
    const existing = company({
      latitude: null,
      longitude: null,
      geocodedAt: null,
    });

    const result = await geocodeCompany(existing, provider, NOW);

    expect(result).toMatchObject({
      status: "failed",
      reason: "provider_error",
      latitude: null,
      longitude: null,
      geocodedAt: null,
      error: "upstream unavailable",
    });
  });

  it("does not geocode when valid coordinates already exist and city/country are unchanged", async () => {
    const provider = mockProvider();
    const cached = company({
      city: "Nürnberg",
      country: "Deutschland",
      latitude: 49.4521,
      longitude: 11.0767,
      geocodedAt: new Date("2026-09-01T00:00:00.000Z"),
      lastGeocodedLocation: { city: "Nürnberg", country: "Deutschland" },
    });

    const result = await geocodeCompany(cached, provider, NOW);

    expect(result).toMatchObject({
      status: "skipped",
      reason: "cached",
      latitude: 49.4521,
      longitude: 11.0767,
      geocodedAt: cached.geocodedAt,
    });
    expect(provider.geocodeCityCountry).not.toHaveBeenCalled();
    expect(decideGeocode(cached)).toEqual({ action: "skip", reason: "cached" });
  });

  it("rejects invalid provider coordinates instead of caching them", async () => {
    const provider = mockProvider(async () => ({ latitude: 999, longitude: 11 }));
    const result = await geocodeCompany(company(), provider, NOW);

    expect(result.status).toBe("failed");
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.geocodedAt).toBeNull();
  });

  it("reads API keys only from the environment", () => {
    const previous = process.env.GEOCODING_API_KEY;
    delete process.env.GEOCODING_API_KEY;
    expect(geocodingApiKeyFromEnv()).toBeNull();
    process.env.GEOCODING_API_KEY = "env-only-test-key";
    expect(geocodingApiKeyFromEnv()).toBe("env-only-test-key");
    if (previous === undefined) {
      delete process.env.GEOCODING_API_KEY;
    } else {
      process.env.GEOCODING_API_KEY = previous;
    }
  });

  it("does not invent coordinates when no provider is configured", async () => {
    const result = await geocodeCompany(company(), new UnconfiguredGeocodingProvider(), NOW);
    expect(result.status).toBe("failed");
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
  });

  it("re-geocodes when the caller knows city/country changed since the last cache", async () => {
    const provider = mockProvider(async () => ({ latitude: 47.986, longitude: 10.181 }));
    const moved = company({
      city: "Memmingen",
      country: "Deutschland",
      latitude: 49.4521,
      longitude: 11.0767,
      geocodedAt: new Date("2026-09-01T00:00:00.000Z"),
      lastGeocodedLocation: { city: "Nürnberg", country: "Deutschland" },
    });

    const result = await geocodeCompany(moved, provider, NOW);

    expect(result.status).toBe("geocoded");
    expect(provider.geocodeCityCountry).toHaveBeenCalledWith("Memmingen", "Deutschland");
    if (result.status === "geocoded") {
      expect(result.latitude).toBe(47.986);
      expect(result.geocodedAt).toEqual(NOW);
    }
  });
});
