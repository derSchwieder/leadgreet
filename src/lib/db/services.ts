import type {
  BusinessCaseType,
  CompanySize,
  ContactRole,
  Prisma,
  Service,
  SignalType,
} from "@prisma/client";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export interface CreateServiceInput {
  name: string;
  description?: string | null;
  targetIndustries?: string[];
  targetCompanySizes?: CompanySize[];
  targetRoles?: ContactRole[];
  matchingSignalTypes?: SignalType[];
  businessCaseTypes?: BusinessCaseType[];
  valuePropositions?: string[];
  conversationStarter?: string | null;
  isActive?: boolean;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

function accountScoped(id: string, accountId: string): Prisma.ServiceWhereInput {
  return { id, accountId };
}

export async function listServices(accountId: string): Promise<Service[]> {
  return prisma.service.findMany({
    where: { accountId },
    orderBy: { name: "asc" },
  });
}

export async function getServiceById(id: string, accountId: string): Promise<Service> {
  const row = await prisma.service.findFirst({
    where: accountScoped(id, accountId),
  });
  if (!row) {
    throw new NotFoundError("Service", id);
  }
  return row;
}

export async function createService(
  accountId: string,
  input: CreateServiceInput,
): Promise<Service> {
  return prisma.service.create({
    data: {
      accountId,
      name: input.name,
      description: input.description ?? null,
      targetIndustries: input.targetIndustries ?? [],
      targetCompanySizes: input.targetCompanySizes ?? [],
      targetRoles: input.targetRoles ?? [],
      matchingSignalTypes: input.matchingSignalTypes ?? [],
      businessCaseTypes: input.businessCaseTypes ?? [],
      valuePropositions: input.valuePropositions ?? [],
      conversationStarter: input.conversationStarter ?? null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateService(
  accountId: string,
  id: string,
  input: UpdateServiceInput,
): Promise<Service> {
  await getServiceById(id, accountId);

  return prisma.service.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.targetIndustries !== undefined
        ? { targetIndustries: input.targetIndustries }
        : {}),
      ...(input.targetCompanySizes !== undefined
        ? { targetCompanySizes: input.targetCompanySizes }
        : {}),
      ...(input.targetRoles !== undefined ? { targetRoles: input.targetRoles } : {}),
      ...(input.matchingSignalTypes !== undefined
        ? { matchingSignalTypes: input.matchingSignalTypes }
        : {}),
      ...(input.businessCaseTypes !== undefined
        ? { businessCaseTypes: input.businessCaseTypes }
        : {}),
      ...(input.valuePropositions !== undefined
        ? { valuePropositions: input.valuePropositions }
        : {}),
      ...(input.conversationStarter !== undefined
        ? { conversationStarter: input.conversationStarter }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function deleteService(accountId: string, id: string): Promise<Service> {
  await getServiceById(id, accountId);
  return prisma.service.delete({ where: { id } });
}
