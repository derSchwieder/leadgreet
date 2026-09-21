import type { CompanyGeoState, GeocodeDecision } from "./types";

export function trimPlacePart(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hasValidCoordinates(
  latitude: number | null,
  longitude: number | null,
): boolean {
  return (
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function placesEqual(
  left: { city: string; country: string },
  right: { city: string; country: string },
): boolean {
  return (
    left.city.toLocaleLowerCase() === right.city.toLocaleLowerCase() &&
    left.country.toLocaleLowerCase() === right.country.toLocaleLowerCase()
  );
}

/**
 * Decide whether a company should be sent to a geocoding provider.
 *
 * Location-change detection at geocode time is a fallback. The source of
 * truth is write-time invalidation in updateCompany: changing city/country
 * clears latitude/longitude/geocodedAt so the next geocode sees missing coords.
 */
export function decideGeocode(company: CompanyGeoState): GeocodeDecision {
  const city = trimPlacePart(company.city);
  const country = trimPlacePart(company.country);

  if (!city || !country) {
    return { action: "skip", reason: "missing_city_or_country" };
  }

  const current = { city, country };
  const last = company.lastGeocodedLocation
    ? {
        city: trimPlacePart(company.lastGeocodedLocation.city),
        country: trimPlacePart(company.lastGeocodedLocation.country),
      }
    : null;

  if (last?.city && last.country && !placesEqual(current, { city: last.city, country: last.country })) {
    return { action: "geocode", reason: "location_changed" };
  }

  if (!hasValidCoordinates(company.latitude, company.longitude)) {
    return { action: "geocode", reason: "missing_coordinates" };
  }

  return { action: "skip", reason: "cached" };
}
