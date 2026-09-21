import { GeocodingError, type GeocodingCoordinates, type GeocodingProvider } from "./types";

/**
 * Default adapter until a concrete provider is wired.
 * Throws on use so missing configuration cannot silently invent coordinates.
 */
export class UnconfiguredGeocodingProvider implements GeocodingProvider {
  readonly name = "unconfigured";

  async geocodeCityCountry(_city: string, _country: string): Promise<GeocodingCoordinates> {
    throw new GeocodingError(
      "No geocoding provider configured. Set GEOCODING_PROVIDER and, if required, GEOCODING_API_KEY.",
    );
  }
}

/** API keys must come from the environment. Never hardcode a key. */
export function geocodingApiKeyFromEnv(): string | null {
  const key = process.env.GEOCODING_API_KEY?.trim();
  return key ? key : null;
}

export function getGeocodingProvider(): GeocodingProvider {
  return new UnconfiguredGeocodingProvider();
}
