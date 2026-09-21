import { lookupDemoCoordinates } from "./demo-coordinates";
import type { RadarCandidate, RadarPoint } from "./types";

function websiteValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildRadarPoints(candidates: RadarCandidate[]): RadarPoint[] {
  const points: RadarPoint[] = [];

  for (const candidate of candidates) {
    const city = candidate.city?.trim() ?? "";
    const country = candidate.country?.trim() ?? "";
    if (!city || !country) continue;

    const coordinates = lookupDemoCoordinates(city);
    if (!coordinates) continue;

    points.push({
      companyId: candidate.companyId,
      name: candidate.name,
      city,
      country,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      greet: candidate.greet,
      signalTitle: candidate.signalTitle,
      website: websiteValue(candidate.website),
    });
  }

  return points.sort((left, right) => {
    if (right.greet !== left.greet) return right.greet - left.greet;
    return left.name.localeCompare(right.name, "de");
  });
}
