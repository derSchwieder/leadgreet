import type {
  BusinessCaseType,
  CompanySize,
  ContactRole,
  ContentItem,
  ContentType,
  Prisma,
  Service,
} from "@prisma/client";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export interface CreateContentItemInput {
  name: string;
  description?: string | null;
  type: ContentType;
  url?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  tags?: string[];
  businessCaseTypes?: BusinessCaseType[];
  targetRoles?: ContactRole[];
  targetCompanySizes?: CompanySize[];
  serviceIds?: string[];
  isActive?: boolean;
}

export type UpdateContentItemInput = Partial<CreateContentItemInput>;

export type ContentItemListFilter = {
  type?: ContentType;
  serviceId?: string;
  businessCaseType?: BusinessCaseType;
  isActive?: boolean;
};

export type ContentItemWithServices = ContentItem & {
  services: Pick<Service, "id" | "name">[];
};

const serviceSelect = { id: true, name: true } as const;

function accountScoped(id: string, accountId: string): Prisma.ContentItemWhereInput {
  return { id, accountId };
}

async function connectAccountServices(
  accountId: string,
  serviceIds: string[],
): Promise<Array<{ id: string }>> {
  if (serviceIds.length === 0) return [];
  const uniqueIds = [...new Set(serviceIds)];
  const found = await prisma.service.findMany({
    where: { accountId, id: { in: uniqueIds } },
    select: { id: true },
  });
  if (found.length !== uniqueIds.length) {
    const missing = uniqueIds.find((id) => !found.some((row) => row.id === id));
    throw new NotFoundError("Service", missing ?? uniqueIds[0]!);
  }
  return found;
}

export async function listContentItems(
  accountId: string,
  filter: ContentItemListFilter = {},
): Promise<ContentItemWithServices[]> {
  return prisma.contentItem.findMany({
    where: {
      accountId,
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
      ...(filter.businessCaseType
        ? { businessCaseTypes: { has: filter.businessCaseType } }
        : {}),
      ...(filter.serviceId
        ? { services: { some: { id: filter.serviceId, accountId } } }
        : {}),
    },
    include: { services: { select: serviceSelect, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function listActiveContentItems(
  accountId: string,
): Promise<ContentItemWithServices[]> {
  return listContentItems(accountId, { isActive: true });
}

export async function getContentItemById(
  accountId: string,
  id: string,
): Promise<ContentItemWithServices> {
  const row = await prisma.contentItem.findFirst({
    where: accountScoped(id, accountId),
    include: { services: { select: serviceSelect, orderBy: { name: "asc" } } },
  });
  if (!row) {
    throw new NotFoundError("ContentItem", id);
  }
  return row;
}

export async function createContentItem(
  accountId: string,
  input: CreateContentItemInput,
): Promise<ContentItemWithServices> {
  const services = await connectAccountServices(accountId, input.serviceIds ?? []);
  return prisma.contentItem.create({
    data: {
      accountId,
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      url: input.url ?? null,
      fileName: input.fileName ?? null,
      mimeType: input.mimeType ?? null,
      tags: input.tags ?? [],
      businessCaseTypes: input.businessCaseTypes ?? [],
      targetRoles: input.targetRoles ?? [],
      targetCompanySizes: input.targetCompanySizes ?? [],
      isActive: input.isActive ?? true,
      services: { connect: services },
    },
    include: { services: { select: serviceSelect, orderBy: { name: "asc" } } },
  });
}

export async function updateContentItem(
  accountId: string,
  id: string,
  input: UpdateContentItemInput,
): Promise<ContentItemWithServices> {
  await getContentItemById(accountId, id);
  const services =
    input.serviceIds !== undefined
      ? await connectAccountServices(accountId, input.serviceIds)
      : null;

  return prisma.contentItem.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
      ...(input.mimeType !== undefined ? { mimeType: input.mimeType } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.businessCaseTypes !== undefined
        ? { businessCaseTypes: input.businessCaseTypes }
        : {}),
      ...(input.targetRoles !== undefined ? { targetRoles: input.targetRoles } : {}),
      ...(input.targetCompanySizes !== undefined
        ? { targetCompanySizes: input.targetCompanySizes }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(services !== null ? { services: { set: services } } : {}),
    },
    include: { services: { select: serviceSelect, orderBy: { name: "asc" } } },
  });
}

export async function deleteContentItem(
  accountId: string,
  id: string,
): Promise<ContentItemWithServices> {
  const existing = await getContentItemById(accountId, id);
  await prisma.contentItem.delete({ where: { id } });
  return existing;
}
