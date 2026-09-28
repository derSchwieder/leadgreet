import type { SignalType, UnresolvedSignalStatus } from "@prisma/client";
import { assertUnresolvedSignalTransition } from "@/lib/discovery/status";
import type { CreateCompanyInput } from "./companies";
import { createCompany } from "./companies";
import { prisma } from "./client";
import { createSignal } from "./signals";
import { ConflictError, NotFoundError } from "./serialize";

const DEFAULT_LIST_LIMIT = 50;
const INBOX_STATUSES: UnresolvedSignalStatus[] = ["NEW", "REVIEWED"];

const discoveryInclude = {
  resolvedCompany: { select: { id: true, name: true } },
  resolvedContact: { select: { id: true, fullName: true, role: true } },
  resolvedSignal: { select: { id: true, title: true, type: true } },
} as const;

export type DiscoveryItem = {
  id: string;
  title: string;
  description: string | null;
  signalType: SignalType | null;
  source: string;
  sourceUrl: string | null;
  detectedAt: Date;
  publishedAt: Date | null;
  companyNameRaw: string | null;
  personNameRaw: string | null;
  domainRaw: string | null;
  locationRaw: string | null;
  status: UnresolvedSignalStatus;
  confidence: number | null;
  rawPayload: unknown | null;
  resolvedCompany: { id: string; name: string } | null;
  resolvedContact: { id: string; fullName: string; role: string } | null;
  resolvedSignal: { id: string; title: string; type: SignalType } | null;
};

type DiscoveryRow = {
  id: string;
  title: string;
  description: string | null;
  signalType: SignalType | null;
  source: string;
  sourceUrl: string | null;
  detectedAt: Date;
  publishedAt: Date | null;
  companyNameRaw: string | null;
  personNameRaw: string | null;
  domainRaw: string | null;
  locationRaw: string | null;
  status: UnresolvedSignalStatus;
  confidence: number | null;
  rawPayload: unknown;
  resolvedCompany: { id: string; name: string } | null;
  resolvedContact: { id: string; fullName: string; role: string } | null;
  resolvedSignal: { id: string; title: string; type: SignalType } | null;
};

export function isMissingUnresolvedSignalTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "P2021" && /UnresolvedSignal/i.test(candidate.message ?? "")) {
    return true;
  }
  return (
    typeof candidate.message === "string" &&
    /UnresolvedSignal/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

function serializeDiscovery(row: DiscoveryRow): DiscoveryItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    signalType: row.signalType,
    source: row.source,
    sourceUrl: row.sourceUrl,
    detectedAt: row.detectedAt,
    publishedAt: row.publishedAt,
    companyNameRaw: row.companyNameRaw,
    personNameRaw: row.personNameRaw,
    domainRaw: row.domainRaw,
    locationRaw: row.locationRaw,
    status: row.status,
    confidence: row.confidence,
    rawPayload: row.rawPayload ?? null,
    resolvedCompany: row.resolvedCompany,
    resolvedContact: row.resolvedContact,
    resolvedSignal: row.resolvedSignal,
  };
}

function toInboxItem(item: DiscoveryItem): Omit<DiscoveryItem, "rawPayload" | "locationRaw" | "resolvedSignal"> {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    signalType: item.signalType,
    source: item.source,
    sourceUrl: item.sourceUrl,
    detectedAt: item.detectedAt,
    publishedAt: item.publishedAt,
    companyNameRaw: item.companyNameRaw,
    personNameRaw: item.personNameRaw,
    domainRaw: item.domainRaw,
    status: item.status,
    confidence: item.confidence,
    resolvedCompany: item.resolvedCompany,
    resolvedContact: item.resolvedContact,
  };
}

export type DiscoveryListItem = ReturnType<typeof toInboxItem>;

export async function listUnresolvedSignals(filters?: {
  status?: UnresolvedSignalStatus;
  signalType?: SignalType;
  limit?: number;
}): Promise<DiscoveryListItem[]> {
  const rows = await prisma.unresolvedSignal.findMany({
    where: {
      status: filters?.status ?? { in: INBOX_STATUSES },
      signalType: filters?.signalType,
    },
    include: discoveryInclude,
    orderBy: { detectedAt: "desc" },
    take: filters?.limit ?? DEFAULT_LIST_LIMIT,
  });
  return rows.map((row) => toInboxItem(serializeDiscovery(row)));
}

export async function getUnresolvedSignalById(id: string): Promise<DiscoveryItem> {
  const row = await prisma.unresolvedSignal.findUnique({
    where: { id },
    include: discoveryInclude,
  });
  if (!row) {
    throw new NotFoundError("UnresolvedSignal", id);
  }
  return serializeDiscovery(row);
}

async function loadForUpdate(id: string) {
  const row = await prisma.unresolvedSignal.findUnique({
    where: { id },
    include: discoveryInclude,
  });
  if (!row) {
    throw new NotFoundError("UnresolvedSignal", id);
  }
  return row;
}

export async function reviewUnresolvedSignal(id: string): Promise<DiscoveryItem> {
  const current = await loadForUpdate(id);
  assertUnresolvedSignalTransition(current.status, "REVIEWED");
  const row = await prisma.unresolvedSignal.update({
    where: { id },
    data: { status: "REVIEWED" },
    include: discoveryInclude,
  });
  return serializeDiscovery(row);
}

export async function dismissUnresolvedSignal(id: string): Promise<DiscoveryItem> {
  const current = await loadForUpdate(id);
  assertUnresolvedSignalTransition(current.status, "DISMISSED");
  const row = await prisma.unresolvedSignal.update({
    where: { id },
    data: { status: "DISMISSED" },
    include: discoveryInclude,
  });
  return serializeDiscovery(row);
}

export type ResolveUnresolvedSignalInput =
  | { companyId: string; createCompany?: undefined }
  | { companyId?: undefined; createCompany: CreateCompanyInput };

async function findReusableSignal(companyId: string, current: {
  title: string;
  sourceUrl: string | null;
  source: string;
}) {
  return prisma.signal.findFirst({
    where: {
      companyId,
      title: current.title,
      ...(current.sourceUrl
        ? { sourceUrl: current.sourceUrl }
        : { sourceName: current.source }),
    },
    orderBy: { detectedAt: "desc" },
  });
}

export async function resolveUnresolvedSignal(
  id: string,
  input: ResolveUnresolvedSignalInput,
): Promise<DiscoveryItem> {
  const current = await loadForUpdate(id);
  assertUnresolvedSignalTransition(current.status, "RESOLVED");

  if (current.resolvedCompanyId || current.resolvedSignalId) {
    throw new ConflictError("UnresolvedSignal is already resolved");
  }

  const company = input.createCompany
    ? await createCompany(input.createCompany)
    : await prisma.company.findUnique({ where: { id: input.companyId } });

  if (!company) {
    throw new NotFoundError("Company", input.companyId ?? "");
  }

  let signalId: string | null = null;
  const reusable = await findReusableSignal(company.id, current);
  if (reusable) {
    signalId = reusable.id;
  } else {
    const created = await createSignal({
      companyId: company.id,
      type: current.signalType ?? "OTHER",
      title: current.title,
      description: current.description,
      detectedAt: current.detectedAt,
      eventDate: current.publishedAt,
      sourceUrl: current.sourceUrl,
      sourceName: current.source,
    });
    signalId = created.id;
  }

  const row = await prisma.unresolvedSignal.update({
    where: { id },
    data: {
      status: "RESOLVED",
      resolvedCompanyId: company.id,
      resolvedSignalId: signalId,
    },
    include: discoveryInclude,
  });
  return serializeDiscovery(row);
}
