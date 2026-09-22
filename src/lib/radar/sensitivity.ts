/** Visible when Company-Greet meets the radar sensitivity threshold. */
export function matchesRadarSensitivity(greet: number, threshold: number): boolean {
  return greet >= threshold;
}

export function filterVisibleRadarPoints<T extends { greet: number }>(
  points: ReadonlyArray<T>,
  threshold: number,
): T[] {
  return points.filter((point) => matchesRadarSensitivity(point.greet, threshold));
}

export function countVisibleRadarPoints(
  points: ReadonlyArray<{ greet: number }>,
  threshold: number,
): number {
  return filterVisibleRadarPoints(points, threshold).length;
}
