import { trimPlacePart } from "./decide";

export const CLEARED_GEO_CACHE = {
  latitude: null,
  longitude: null,
  geocodedAt: null,
} as const;

export function locationPartsEqual(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = trimPlacePart(left);
  const b = trimPlacePart(right);
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

/**
 * Geo cache is valid only for the current city + country.
 * Changing either field must clear latitude/longitude/geocodedAt.
 * Omitted patch fields are treated as unchanged.
 */
export function shouldClearGeoCache(
  current: { city: string | null; country: string | null },
  patch: { city?: string | null; country?: string | null },
): boolean {
  const nextCity = patch.city !== undefined ? patch.city : current.city;
  const nextCountry = patch.country !== undefined ? patch.country : current.country;
  return (
    !locationPartsEqual(current.city, nextCity) ||
    !locationPartsEqual(current.country, nextCountry)
  );
}
