const SCOPE_CENTER = 100;
const SCOPE_RADIUS = 78;
const SCOPE_DOT_LIMIT = 16;

export type RadarScopeDot = {
  id: string;
  name: string;
  x: number;
  y: number;
  greet: number;
};

export function projectRadarScopeDots(
  points: ReadonlyArray<{
    companyId: string;
    name: string;
    latitude: number;
    longitude: number;
    greet: number;
  }>,
): RadarScopeDot[] {
  const selected = [...points]
    .sort((left, right) => {
      if (right.greet !== left.greet) return right.greet - left.greet;
      return left.name.localeCompare(right.name, "de");
    })
    .slice(0, SCOPE_DOT_LIMIT);

  if (selected.length === 0) return [];

  const latitudes = selected.map((point) => point.latitude);
  const longitudes = selected.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);

  return selected.map((point) => {
    let x = ((point.longitude - minLng) / lngSpan - 0.5) * 2;
    let y = ((maxLat - point.latitude) / latSpan - 0.5) * 2;
    const distance = Math.hypot(x, y);
    if (distance > 1) {
      x /= distance;
      y /= distance;
    }
    return {
      id: point.companyId,
      name: point.name,
      x: SCOPE_CENTER + x * SCOPE_RADIUS,
      y: SCOPE_CENTER + y * SCOPE_RADIUS,
      greet: point.greet,
    };
  });
}
