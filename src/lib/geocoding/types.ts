/**
 * Geocoding is city + country only. No street, postal code, or guessed coordinates.
 *
 * Cache invalidation for a *changed* city/country needs the last successfully
 * geocoded place. That is not persisted on Company yet (only geocodedAt).
 * Callers may pass lastGeocodedLocation in memory; do not add schema fields here.
 */

export interface GeocodingCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodingProvider {
  readonly name: string;
  geocodeCityCountry(city: string, country: string): Promise<GeocodingCoordinates>;
}

export interface CompanyGeoState {
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  geocodedAt: Date | null;
  /**
   * Place that produced the cached coordinates, if the caller knows it.
   * Not stored on Company — see architecture note in decide.ts.
   */
  lastGeocodedLocation?: { city: string; country: string } | null;
}

export type GeocodeSkipReason = "missing_city_or_country" | "cached";
export type GeocodeRunReason = "missing_coordinates" | "location_changed";

export type GeocodeDecision =
  | { action: "skip"; reason: GeocodeSkipReason }
  | { action: "geocode"; reason: GeocodeRunReason };

export type GeocodeAttempt =
  | {
      status: "skipped";
      reason: GeocodeSkipReason;
      city: string | null;
      country: string | null;
      latitude: number | null;
      longitude: number | null;
      geocodedAt: Date | null;
    }
  | {
      status: "geocoded";
      reason: GeocodeRunReason;
      city: string;
      country: string;
      latitude: number;
      longitude: number;
      geocodedAt: Date;
    }
  | {
      status: "failed";
      reason: "provider_error";
      city: string;
      country: string;
      latitude: number | null;
      longitude: number | null;
      geocodedAt: Date | null;
      error: string;
    };

export class GeocodingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GeocodingError";
  }
}
