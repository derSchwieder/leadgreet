import type { ContactRole } from "@prisma/client";
import { prisma } from "./client";
import { ConflictError, NotFoundError } from "./serialize";

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
  notes?: string | null;
  confidenceScore?: number;
  isDecisionMaker?: boolean;
  isSeed?: boolean;
}

export type UpdateContactInput = Partial<Omit<CreateContactInput, "companyId" | "isSeed">>;

export type ContactWithCompany = {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: ContactRole;
  department: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  sourceUrl: string | null;
  notes: string | null;
  confidenceScore: number;
  isDecisionMaker: boolean;
  isSeed: boolean;
  createdAt: Date;
  updatedAt: Date;
  company: { id: string; name: string; isSeed: boolean };
};

const companySelect = { id: true, name: true, isSeed: true } as const;

const contactSelect = {
  id: true,
  companyId: true,
  firstName: true,
  lastName: true,
  fullName: true,
  role: true,
  department: true,
  email: true,
  phone: true,
  linkedinUrl: true,
  sourceUrl: true,
  confidenceScore: true,
  isDecisionMaker: true,
  isSeed: true,
  createdAt: true,
  updatedAt: true,
  company: { select: companySelect },
} as const;

function fullNameFrom(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function withNotes(
  row: Omit<ContactWithCompany, "notes"> & { notes?: string | null },
  notes: string | null = null,
): ContactWithCompany {
  return { ...row, notes: row.notes ?? notes };
}

export function isMissingContactNotesColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; meta?: { column?: string }; message?: string };
  if (candidate.code === "P2022") return true;
  return (
    typeof candidate.message === "string" &&
    /Contact.*notes|column .*notes/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

let notesColumnAvailable: boolean | null = null;

async function withOptionalNotesColumn<T>(
  withNotesColumn: () => Promise<T>,
  withoutNotesColumn: () => Promise<T>,
): Promise<T> {
  if (notesColumnAvailable === false) {
    return withoutNotesColumn();
  }
  try {
    const result = await withNotesColumn();
    notesColumnAvailable = true;
    return result;
  } catch (error) {
    if (!isMissingContactNotesColumn(error)) throw error;
    notesColumnAvailable = false;
    return withoutNotesColumn();
  }
}

async function requireCompanyForAccount(accountId: string, companyId: string) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { accountId, companyId },
    select: { id: true },
  });
  if (!opportunity) {
    throw new NotFoundError("Company", companyId);
  }
  return opportunity;
}

export async function listContacts(filters?: {
  companyId?: string;
}): Promise<ContactWithCompany[]> {
  const where = filters?.companyId ? { companyId: filters.companyId } : undefined;
  const orderBy = [{ isDecisionMaker: "desc" as const }, { lastName: "asc" as const }];

  return withOptionalNotesColumn(
    async () => {
      const rows = await prisma.contact.findMany({
        where,
        include: { company: { select: companySelect } },
        orderBy,
      });
      return rows.map((row) => withNotes(row, row.notes ?? null));
    },
    async () => {
      const rows = await prisma.contact.findMany({
        where,
        select: contactSelect,
        orderBy,
      });
      return rows.map((row) => withNotes(row, null));
    },
  );
}

export async function getContactById(id: string): Promise<ContactWithCompany> {
  return withOptionalNotesColumn(
    async () => {
      const row = await prisma.contact.findUnique({
        where: { id },
        include: { company: { select: companySelect } },
      });
      if (!row) {
        throw new NotFoundError("Contact", id);
      }
      return withNotes(row, row.notes ?? null);
    },
    async () => {
      const row = await prisma.contact.findUnique({
        where: { id },
        select: contactSelect,
      });
      if (!row) {
        throw new NotFoundError("Contact", id);
      }
      return withNotes(row, null);
    },
  );
}

function createData(input: CreateContactInput) {
  return {
    companyId: input.companyId,
    firstName: input.firstName,
    lastName: input.lastName,
    fullName: fullNameFrom(input.firstName, input.lastName),
    role: input.role,
    department: input.department ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
    sourceUrl: input.sourceUrl ?? null,
    confidenceScore: input.confidenceScore ?? 50,
    isDecisionMaker: input.isDecisionMaker ?? false,
    isSeed: input.isSeed ?? false,
  };
}

export async function createContact(input: CreateContactInput): Promise<ContactWithCompany> {
  const data = createData(input);

  if (input.notes !== undefined) {
    return withOptionalNotesColumn(
      async () => {
        const row = await prisma.contact.create({
          data: { ...data, notes: input.notes },
          include: { company: { select: companySelect } },
        });
        return withNotes(row, row.notes ?? null);
      },
      async () => {
        const row = await prisma.contact.create({
          data,
          select: contactSelect,
        });
        return withNotes(row, null);
      },
    );
  }

  const row = await prisma.contact.create({
    data,
    select: contactSelect,
  });
  return withNotes(row, null);
}

export async function getContactForAccount(
  accountId: string,
  id: string,
): Promise<ContactWithCompany> {
  const contact = await getContactById(id);
  await requireCompanyForAccount(accountId, contact.companyId);
  return contact;
}

export async function createContactForAccount(
  accountId: string,
  input: CreateContactInput,
): Promise<ContactWithCompany> {
  await requireCompanyForAccount(accountId, input.companyId);
  return createContact(input);
}

export async function updateContact(
  id: string,
  input: UpdateContactInput,
): Promise<ContactWithCompany> {
  const existing = await getContactById(id);
  const firstName = input.firstName ?? existing.firstName;
  const lastName = input.lastName ?? existing.lastName;
  const data = {
    ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
    ...(input.firstName !== undefined || input.lastName !== undefined
      ? { fullName: fullNameFrom(firstName, lastName) }
      : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.department !== undefined ? { department: input.department } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl } : {}),
    ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
    ...(input.confidenceScore !== undefined ? { confidenceScore: input.confidenceScore } : {}),
    ...(input.isDecisionMaker !== undefined ? { isDecisionMaker: input.isDecisionMaker } : {}),
  };

  if (input.notes !== undefined) {
    return withOptionalNotesColumn(
      async () => {
        const row = await prisma.contact.update({
          where: { id: existing.id },
          data: { ...data, notes: input.notes },
          include: { company: { select: companySelect } },
        });
        return withNotes(row, row.notes ?? null);
      },
      async () => {
        const row = await prisma.contact.update({
          where: { id: existing.id },
          data,
          select: contactSelect,
        });
        return withNotes(row, existing.notes);
      },
    );
  }

  const row = await prisma.contact.update({
    where: { id: existing.id },
    data,
    select: contactSelect,
  });
  return withNotes(row, existing.notes);
}

export async function updateContactForAccount(
  accountId: string,
  id: string,
  input: UpdateContactInput,
): Promise<ContactWithCompany> {
  const existing = await getContactById(id);
  await requireCompanyForAccount(accountId, existing.companyId);
  return updateContact(id, input);
}

export async function deleteContactForAccount(
  accountId: string,
  id: string,
): Promise<ContactWithCompany> {
  const existing = await getContactById(id);
  await requireCompanyForAccount(accountId, existing.companyId);

  const [activityCount, todoCount, recommendedCount] = await Promise.all([
    prisma.activity.count({ where: { contactId: id } }),
    prisma.salesTodo.count({ where: { contactId: id } }),
    prisma.opportunity.count({ where: { recommendedContactId: id } }),
  ]);

  if (recommendedCount > 0) {
    throw new ConflictError(
      "Dieser Kontakt ist die Greetelligence-Empfehlung und kann nicht entfernt werden.",
    );
  }
  if (activityCount > 0 || todoCount > 0) {
    throw new ConflictError(
      "Dieser Kontakt ist in Aktivitäten oder To-dos hinterlegt und kann nicht entfernt werden.",
    );
  }

  await prisma.contact.delete({
    where: { id: existing.id },
    select: { id: true },
  });
  return existing;
}
