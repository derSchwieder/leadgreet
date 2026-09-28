import {
  discoveryErrorMessage,
  toDiscoveryViewItem,
  type DiscoveryViewItem,
} from "./discovery-presentation";
import type { UnresolvedSignalStatus } from "@/types";

export type DiscoveryCompanyOption = {
  id: string;
  name: string;
  website: string | null;
};

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function throwDiscoveryError(response: Response): never {
  throw new Error(discoveryErrorMessage(response.status));
}

export async function fetchDiscoveryList(filters: {
  status?: UnresolvedSignalStatus;
  signalType?: string;
  limit?: number;
}): Promise<DiscoveryViewItem[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.signalType) params.set("signalType", filters.signalType);
  params.set("limit", String(filters.limit ?? 100));
  const response = await fetch(`/api/discovery?${params.toString()}`);
  if (!response.ok) throwDiscoveryError(response);
  const body = (await readJson(response)) as { items?: DiscoveryViewItem[] } | null;
  return (body?.items ?? []).map(toDiscoveryViewItem);
}

export async function fetchDiscoveryItem(id: string): Promise<DiscoveryViewItem> {
  const response = await fetch(`/api/discovery/${id}`);
  if (!response.ok) throwDiscoveryError(response);
  const body = (await readJson(response)) as { item?: DiscoveryViewItem } | null;
  if (!body?.item) throw new Error(discoveryErrorMessage(404));
  return toDiscoveryViewItem(body.item);
}

export async function reviewDiscoveryItem(id: string): Promise<DiscoveryViewItem> {
  const response = await fetch(`/api/discovery/${id}/review`, { method: "POST" });
  if (!response.ok) throwDiscoveryError(response);
  const body = (await readJson(response)) as { item?: DiscoveryViewItem } | null;
  if (!body?.item) throw new Error(discoveryErrorMessage(response.status));
  return toDiscoveryViewItem(body.item);
}

export async function dismissDiscoveryItem(id: string): Promise<DiscoveryViewItem> {
  const response = await fetch(`/api/discovery/${id}/dismiss`, { method: "POST" });
  if (!response.ok) throwDiscoveryError(response);
  const body = (await readJson(response)) as { item?: DiscoveryViewItem } | null;
  if (!body?.item) throw new Error(discoveryErrorMessage(response.status));
  return toDiscoveryViewItem(body.item);
}

export async function resolveDiscoveryItem(
  id: string,
  input: { companyId: string } | { createCompany: { name: string; website?: string | null } },
): Promise<DiscoveryViewItem> {
  const response = await fetch(`/api/discovery/${id}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throwDiscoveryError(response);
  const body = (await readJson(response)) as { item?: DiscoveryViewItem } | null;
  if (!body?.item) throw new Error(discoveryErrorMessage(response.status));
  return toDiscoveryViewItem(body.item);
}

export async function fetchDiscoveryCompanies(): Promise<DiscoveryCompanyOption[]> {
  const response = await fetch("/api/companies");
  if (!response.ok) throwDiscoveryError(response);
  const body = (await readJson(response)) as { companies?: DiscoveryCompanyOption[] } | null;
  return body?.companies ?? [];
}
