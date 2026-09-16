import type { Contact, ContactRole } from "@prisma/client";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export interface CreateContactInput {
  companyId: string;
  firstName: string;
  lastName: string;
  role: ContactRole;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  sourceUrl?: string | null;
  confidenceScore?: number;
  isDecisionMaker?: boolean;
  isSeed?: boolean;
}

export type ContactWithCompany = Contact & {
  company: { id: string; name: string; isSeed: boolean };
};

export async function listContacts(filters?: {
  companyId?: string;
}): Promise<ContactWithCompany[]> {
  return prisma.contact.findMany({
    where: filters?.companyId ? { companyId: filters.companyId } : undefined,
    include: {
      company: { select: { id: true, name: true, isSeed: true } },
    },
    orderBy: [{ isDecisionMaker: "desc" }, { lastName: "asc" }],
  });
}

export async function getContactById(id: string): Promise<ContactWithCompany> {
  const row = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true, isSeed: true } },
    },
  });
  if (!row) {
    throw new NotFoundError("Contact", id);
  }
  return row;
}

export async function createContact(input: CreateContactInput): Promise<ContactWithCompany> {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  return prisma.contact.create({
    data: {
      companyId: input.companyId,
      firstName: input.firstName,
      lastName: input.lastName,
      fullName,
      role: input.role,
      department: input.department ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      sourceUrl: input.sourceUrl ?? null,
      confidenceScore: input.confidenceScore ?? 50,
      isDecisionMaker: input.isDecisionMaker ?? false,
      isSeed: input.isSeed ?? false,
    },
    include: {
      company: { select: { id: true, name: true, isSeed: true } },
    },
  });
}
