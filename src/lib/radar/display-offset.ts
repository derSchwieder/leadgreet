import type { RadarPoint } from "./types";

/** Cluster markers closer than ~22 km — they overlap at the Germany start view. */
const PROXIMITY_DEGREES = 0.2;
/** Target gap between two clustered markers, in lat-equivalent degrees (~31 km). */
const PAIR_SEPARATION_DEGREES = 0.28;
const STACKED_EPSILON = 1e-6;

function lngScale(latitude: number): number {
  return Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);
}

function planarDistance(left: RadarPoint, right: RadarPoint): number {
  const scale = lngScale((left.latitude + right.latitude) / 2);
  return Math.hypot(
    left.latitude - right.latitude,
    (left.longitude - right.longitude) * scale,
  );
}

function clusterIndices(points: RadarPoint[]): number[][] {
  const parent = points.map((_, index) => index);

  function find(index: number): number {
    let current = index;
    let parentIndex = parent[current];
    while (parentIndex !== undefined && parentIndex !== current) {
      const grandParent = parent[parentIndex] ?? parentIndex;
      parent[current] = grandParent;
      current = grandParent;
      parentIndex = parent[current];
    }
    return current;
  }

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (planarDistance(points[i]!, points[j]!) > PROXIMITY_DEGREES) continue;
      const left = find(i);
      const right = find(j);
      if (left !== right) parent[left] = right;
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < points.length; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(i);
    groups.set(root, group);
  }
  return [...groups.values()];
}

function ringRadius(count: number): number {
  if (count <= 2) return PAIR_SEPARATION_DEGREES / 2;
  return PAIR_SEPARATION_DEGREES / (2 * Math.sin(Math.PI / count));
}

function spreadGroup(group: RadarPoint[]): RadarPoint[] {
  if (group.length === 1) return [group[0]!];

  const members = [...group].sort((left, right) =>
    left.companyId.localeCompare(right.companyId),
  );
  const centroidLat = members.reduce((sum, point) => sum + point.latitude, 0) / members.length;
  const centroidLng = members.reduce((sum, point) => sum + point.longitude, 0) / members.length;
  const scale = lngScale(centroidLat);
  const radius = ringRadius(members.length);

  const vectors = members.map((point) => {
    const dLat = point.latitude - centroidLat;
    const dLng = (point.longitude - centroidLng) * scale;
    return { point, dLat, dLng, distance: Math.hypot(dLat, dLng) };
  });
  const stacked = vectors.every((vector) => vector.distance < STACKED_EPSILON);

  return vectors.map((vector, index) => {
    let dLat: number;
    let dLng: number;

    if (stacked || vector.distance < STACKED_EPSILON) {
      const angle = (2 * Math.PI * index) / members.length;
      dLat = Math.cos(angle) * radius;
      dLng = Math.sin(angle) * radius;
    } else {
      const factor = Math.max(radius, vector.distance) / vector.distance;
      dLat = vector.dLat * factor;
      dLng = vector.dLng * factor;
    }

    return {
      ...vector.point,
      latitude: centroidLat + dLat,
      longitude: centroidLng + dLng / scale,
    };
  });
}

/**
 * Spread markers that share a location or sit closer than a Greet point
 * so they remain readable. Display-only — does not change stored or API coordinates.
 */
export function offsetOverlappingRadarPoints(points: RadarPoint[]): RadarPoint[] {
  const groups = clusterIndices(points);
  const result: RadarPoint[] = [];
  for (const indices of groups) {
    result.push(...spreadGroup(indices.map((index) => points[index]!)));
  }
  return result;
}
