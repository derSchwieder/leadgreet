import { decideGeocode, hasValidCoordinates, trimPlacePart } from "./decide";
import { GeocodingError, type CompanyGeoState, type GeocodeAttempt, type GeocodingProvider } from "./types";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Geocoding provider failed";
}

function unchangedAttempt(
  company: CompanyGeoState,
  city: string,
  country: string,
): Pick<Extract<GeocodeAttempt, { status: "failed" }>, "city" | "country" | "latitude" | "longitude" | "geocodedAt"> {
  return {
    city,
    country,
    latitude: company.latitude,
    longitude: company.longitude,
    geocodedAt: company.geocodedAt,
  };
}

/**
 * Geocode one company from city + country and return cache fields.
 * Does not write to the database — persistence is a separate step.
 * Never invents or hardcodes coordinates.
 */
export async function geocodeCompany(
  company: CompanyGeoState,
  provider: GeocodingProvider,
  now: Date = new Date(),
): Promise<GeocodeAttempt> {
  const decision = decideGeocode(company);
  const city = trimPlacePart(company.city);
  const country = trimPlacePart(company.country);

  if (decision.action === "skip") {
    return {
      status: "skipped",
      reason: decision.reason,
      city,
      country,
      latitude: company.latitude,
      longitude: company.longitude,
      geocodedAt: company.geocodedAt,
    };
  }

  if (!city || !country) {
    return {
      status: "skipped",
      reason: "missing_city_or_country",
      city,
      country,
      latitude: company.latitude,
      longitude: company.longitude,
      geocodedAt: company.geocodedAt,
    };
  }

  let coordinates;
  try {
    coordinates = await provider.geocodeCityCountry(city, country);
  } catch (error) {
    return {
      status: "failed",
      reason: "provider_error",
      error: errorMessage(error),
      ...unchangedAttempt(company, city, country),
    };
  }

  if (!hasValidCoordinates(coordinates.latitude, coordinates.longitude)) {
    return {
      status: "failed",
      reason: "provider_error",
      error: "Geocoding provider returned invalid coordinates",
      ...unchangedAttempt(company, city, country),
    };
  }

  return {
    status: "geocoded",
    reason: decision.reason,
    city,
    country,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    geocodedAt: now,
  };
}

export function assertGeocodingProvider(provider: GeocodingProvider): GeocodingProvider {
  if (!provider || typeof provider.geocodeCityCountry !== "function") {
    throw new GeocodingError("A geocoding provider is required");
  }
  return provider;
}
