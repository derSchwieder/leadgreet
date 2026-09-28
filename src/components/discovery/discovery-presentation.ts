import { SIGNAL_CATEGORY_LABELS_DE, SIGNAL_TYPE_LABELS } from "@/lib/labels";
import { normalizeSearchQuery } from "@/lib/search/entity-search";
import { SIGNAL_TYPE_CATEGORY, type SignalType, type UnresolvedSignalStatus } from "@/types";

export const DISCOVERY_STATUS_LABELS: Record<UnresolvedSignalStatus, string> = {
  NEW: "Neu",
  REVIEWED: "Geprüft",
  RESOLVED: "Gelöst",
  DISMISSED: "Ignoriert",
};

export const DISCOVERY_STATUS_FILTERS: readonly UnresolvedSignalStatus[] = [
  "NEW",
  "REVIEWED",
  "RESOLVED",
  "DISMISSED",
];

export type DiscoveryViewItem = {
  id: string;
  title: string;
  description: string | null;
  signalType: string | null;
  source: string;
  sourceUrl: string | null;
  detectedAt: string;
  publishedAt: string | null;
  companyNameRaw: string | null;
  personNameRaw: string | null;
  domainRaw: string | null;
  locationRaw?: string | null;
  status: UnresolvedSignalStatus;
  confidence: number | null;
  resolvedCompany: { id: string; name: string } | null;
  resolvedContact: { id: string; fullName: string; role: string } | null;
  resolvedSignal?: { id: string; title: string; type: string } | null;
};

export function toDiscoveryViewItem(item: {
  id: string;
  title: string;
  description: string | null;
  signalType: string | null;
  source: string;
  sourceUrl: string | null;
  detectedAt: Date | string;
  publishedAt: Date | string | null;
  companyNameRaw: string | null;
  personNameRaw: string | null;
  domainRaw: string | null;
  locationRaw?: string | null;
  status: UnresolvedSignalStatus;
  confidence: number | null;
  resolvedCompany: { id: string; name: string } | null;
  resolvedContact: { id: string; fullName: string; role: string } | null;
  resolvedSignal?: { id: string; title: string; type: string } | null;
}): DiscoveryViewItem {
  return {
    ...item,
    detectedAt: new Date(item.detectedAt).toISOString(),
    publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
    locationRaw: item.locationRaw ?? null,
  };
}

export function formatRelativeDetectedAt(value: Date | string, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 1) return "gerade eben";
  if (minutes === 1) return "vor 1 Minute";
  if (minutes < 60) return `vor ${minutes} Minuten`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "vor 1 Stunde";
  if (hours < 24) return `vor ${hours} Stunden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "vor 1 Tag";
  return `vor ${days} Tagen`;
}

export function discoverySignalTypeLabel(type: string | null | undefined): string | null {
  if (!type) return null;
  return SIGNAL_TYPE_LABELS[type] ?? type;
}

export function discoverySignalCategoryLabel(type: string | null | undefined): string | null {
  if (!type || !(type in SIGNAL_TYPE_CATEGORY)) return null;
  const category = SIGNAL_TYPE_CATEGORY[type as SignalType];
  return SIGNAL_CATEGORY_LABELS_DE[category] ?? null;
}

export function matchesDiscoverySearch(item: DiscoveryViewItem, query: string): boolean {
  const needle = normalizeSearchQuery(query);
  if (!needle) return true;
  return [item.title, item.companyNameRaw, item.domainRaw].some((value) =>
    (value ?? "").toLocaleLowerCase("de").includes(needle),
  );
}

export function filterDiscoveryItems(
  items: readonly DiscoveryViewItem[],
  query: string,
  signalType?: string | null,
): DiscoveryViewItem[] {
  return items.filter((item) => {
    if (signalType && item.signalType !== signalType) return false;
    return matchesDiscoverySearch(item, query);
  });
}

export function availableSignalTypes(items: readonly DiscoveryViewItem[]): string[] {
  const types = new Set<string>();
  for (const item of items) {
    if (item.signalType) types.add(item.signalType);
  }
  return [...types].sort();
}

export function websiteFromDomain(domain: string | null | undefined): string | null {
  const value = domain?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function discoveryErrorMessage(status: number): string {
  if (status === 409) return "Dieser Schritt ist in diesem Status nicht möglich.";
  if (status === 404) return "Die Entdeckung wurde nicht gefunden.";
  if (status === 400) return "Die Angaben sind unvollständig.";
  return "Die Aktion konnte nicht ausgeführt werden.";
}

export function replaceDiscoveryItem(
  items: readonly DiscoveryViewItem[],
  updated: DiscoveryViewItem,
): DiscoveryViewItem[] {
  return items.map((item) => (item.id === updated.id ? updated : item));
}

export function keepIfStatus(
  items: readonly DiscoveryViewItem[],
  updated: DiscoveryViewItem,
  status: UnresolvedSignalStatus,
): DiscoveryViewItem[] {
  const next = replaceDiscoveryItem(items, updated);
  return next.filter((item) => item.status === status);
}
