/**
 * City-center coordinates for the Greet Radar MVP.
 * These are public place centroids, not company street addresses.
 * Not written to the database and not produced by a geocoding provider.
 */
export const DEMO_CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  Nürnberg: { latitude: 49.4521, longitude: 11.0767 },
  Memmingen: { latitude: 47.9878, longitude: 10.1811 },
  Herzogenaurach: { latitude: 49.5675, longitude: 10.8856 },
  Wolnzach: { latitude: 48.6031, longitude: 11.6256 },
  Bessenbach: { latitude: 49.9625, longitude: 9.2436 },
  Würzburg: { latitude: 49.7944, longitude: 9.9294 },
  Mammendorf: { latitude: 48.2086, longitude: 11.1864 },
  Wunstorf: { latitude: 52.4236, longitude: 9.4294 },
  Klingenberg: { latitude: 49.7769, longitude: 9.1803 },
};

export function lookupDemoCoordinates(
  city: string | null | undefined,
): { latitude: number; longitude: number } | null {
  if (!city) return null;
  const key = city.trim();
  if (!key) return null;
  return DEMO_CITY_COORDINATES[key] ?? null;
}
