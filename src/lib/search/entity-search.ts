import { filterVisibleRadarPoints } from "@/lib/radar/sensitivity";

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLocaleLowerCase("de");
}

export function matchesNameOrCity(
  query: string,
  name: string | null | undefined,
  city?: string | null,
): boolean {
  const needle = normalizeSearchQuery(query);
  if (!needle) return true;
  const haystacks = [name, city];
  return haystacks.some((value) => (value ?? "").toLocaleLowerCase("de").includes(needle));
}

export function filterByNameOrCity<T extends { name: string; city?: string | null }>(
  items: readonly T[],
  query: string,
): T[] {
  if (!normalizeSearchQuery(query)) return [...items];
  return items.filter((item) => matchesNameOrCity(query, item.name, item.city));
}

export function filterOpportunitiesBySearch<
  T extends { title: string; company: { name: string } },
>(items: readonly T[], query: string): T[] {
  const needle = normalizeSearchQuery(query);
  if (!needle) return [...items];
  return items.filter((item) => {
    const title = item.title.toLocaleLowerCase("de");
    const companyName = item.company.name.toLocaleLowerCase("de");
    return title.includes(needle) || companyName.includes(needle);
  });
}

/**
 * Radar search never bypasses the Greet threshold.
 * Empty query → all points above the threshold.
 */
export function filterRadarPointsBySearch<
  T extends { name: string; city: string; greet: number },
>(points: readonly T[], query: string, threshold: number): T[] {
  return filterByNameOrCity(filterVisibleRadarPoints(points, threshold), query);
}

export function isRadarPointVisible<T extends { name: string; city: string; greet: number }>(
  point: T,
  query: string,
  threshold: number,
): boolean {
  return filterRadarPointsBySearch([point], query, threshold).length === 1;
}
