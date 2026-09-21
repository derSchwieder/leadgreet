import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createActivity } from "./activities";
import { createCompany } from "./companies";
import { createOpportunity } from "./opportunities";
import { createSalesTodo, isMissingSalesTodoTable } from "./todos";
import { prisma } from "./client";
import { ConflictError, NotFoundError } from "./serialize";
import {
  createContact,
  createContactForAccount,
  deleteContactForAccount,
  isMissingContactNotesColumn,
  updateContactForAccount,
} from "./contacts";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("contact workbench tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let notesReady = false;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";
  let foreignCompanyId = "";
  let opportunityAId = "";
  let recommendedContactId = "";
  let otherContactId = "";
  let foreignContactId = "";
  let activityAId = "";

  beforeAll(async () => {
    const [accountA, accountB, company, foreignCompany] = await Promise.all([
      prisma.account.create({
        data: { name: "Contact Account A", slug: `test-contact-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "Contact Account B", slug: `test-contact-b-${suffix}` },
      }),
      createCompany({
        name: `Contact Co ${suffix}`,
        industry: "manufacturing",
        country: "Germany",
        employees: 220,
        companySize: "MEDIUM",
      }),
      createCompany({
        name: `Foreign Contact Co ${suffix}`,
        industry: "logistics",
        country: "Germany",
        employees: 80,
        companySize: "SMALL",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;
    foreignCompanyId = foreignCompany.id;

    const [recommended, other, foreign] = await Promise.all([
      createContact({
        companyId,
        firstName: "Seed",
        lastName: "CDO",
        role: "CDO",
        isDecisionMaker: true,
      }),
      createContact({
        companyId,
        firstName: "Herr",
        lastName: "Meier",
        role: "CIO",
        isDecisionMaker: true,
      }),
      createContact({
        companyId: foreignCompany.id,
        firstName: "Fremd",
        lastName: "Kontakt",
        role: "CEO",
      }),
    ]);
    recommendedContactId = recommended.id;
    otherContactId = other.id;
    foreignContactId = foreign.id;

    const opportunityA = await createOpportunity({
      accountId: accountAId,
      companyId,
      title: `Contact Opp A ${suffix}`,
      recommendedContactId: recommended.id,
    });
    opportunityAId = opportunityA.id;

    const activity = await createActivity(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      contactId: otherContactId,
      type: "CALL",
      subject: "Anruf mit CIO",
      occurredAt: new Date("2026-09-22T09:00:00.000Z"),
    });
    activityAId = activity.id;

    try {
      await prisma.contact.findMany({ take: 1, select: { notes: true } });
      notesReady = true;
    } catch (error) {
      notesReady = !isMissingContactNotesColumn(error);
    }
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.activity.updateMany({
      where: { accountId: { in: accountIds } },
      data: { responseToActivityId: null, contactId: null },
    });
    await prisma.salesTodo.deleteMany({ where: { accountId: { in: accountIds } } }).catch((error) => {
      if (!isMissingSalesTodoTable(error)) throw error;
    });
    await prisma.activity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.scoreBreakdown.deleteMany({
      where: { opportunity: { accountId: { in: accountIds } } },
    });
    await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    const companyIds = [companyId, foreignCompanyId].filter(Boolean);
    if (companyIds.length > 0) {
      await prisma.contact.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
  }, 30000);

  it("can create and edit a contact for a company with an account opportunity", async () => {
    const created = await createContactForAccount(accountAId, {
      companyId,
      firstName: "Neue",
      lastName: "Person",
      role: "HEAD_OF_IT",
      email: "it@example.com",
      phone: "+49 111",
    });
    expect(created.companyId).toBe(companyId);
    expect(created.fullName).toBe("Neue Person");

    const updated = await updateContactForAccount(accountAId, created.id, {
      lastName: "Leitung",
      phone: "+49 222",
    });
    expect(updated.fullName).toBe("Neue Leitung");
    expect(updated.phone).toBe("+49 222");

    const stillRecommended = await prisma.opportunity.findUnique({
      where: { id: opportunityAId },
      select: { recommendedContactId: true },
    });
    expect(stillRecommended?.recommendedContactId).toBe(recommendedContactId);

    await deleteContactForAccount(accountAId, created.id);
  });

  it("stores a persistent contact note without turning it into an activity", async ({ skip }) => {
    skip(!notesReady);
    const created = await createContactForAccount(accountAId, {
      companyId,
      firstName: "Notiz",
      lastName: "Kontakt",
      role: "CIO",
      notes: "CIO bevorzugt kurze Erstansprache per E-Mail.",
    });
    expect(created.notes).toBe("CIO bevorzugt kurze Erstansprache per E-Mail.");

    const updated = await updateContactForAccount(accountAId, created.id, {
      notes: "Lieber zuerst anrufen.",
    });
    expect(updated.notes).toBe("Lieber zuerst anrufen.");

    const activities = await prisma.activity.findMany({
      where: { accountId: accountAId, opportunityId: opportunityAId },
    });
    expect(activities.some((row) => row.note === "Lieber zuerst anrufen.")).toBe(false);

    await deleteContactForAccount(accountAId, created.id);
  });

  it("keeps the intelligence contact unchanged when another contact is used", async () => {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityAId },
      select: { recommendedContactId: true },
    });
    expect(opportunity?.recommendedContactId).toBe(recommendedContactId);

    const activity = await prisma.activity.findUnique({
      where: { id: activityAId },
      select: { contactId: true },
    });
    expect(activity?.contactId).toBe(otherContactId);
    expect(activity?.contactId).not.toBe(recommendedContactId);
  });

  it("does not remove a contact that is referenced by an activity", async () => {
    await expect(deleteContactForAccount(accountAId, otherContactId)).rejects.toBeInstanceOf(
      ConflictError,
    );
    const activity = await prisma.activity.findUnique({
      where: { id: activityAId },
      select: { id: true, contactId: true },
    });
    expect(activity?.id).toBe(activityAId);
    expect(activity?.contactId).toBe(otherContactId);
  });

  it("does not remove the recommended intelligence contact", async () => {
    await expect(deleteContactForAccount(accountAId, recommendedContactId)).rejects.toBeInstanceOf(
      ConflictError,
    );
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityAId },
      select: { recommendedContactId: true },
    });
    expect(opportunity?.recommendedContactId).toBe(recommendedContactId);
  });

  it("can safely remove an unreferenced contact", async () => {
    const created = await createContactForAccount(accountAId, {
      companyId,
      firstName: "Temp",
      lastName: "Kontakt",
      role: "OTHER",
    });
    const deleted = await deleteContactForAccount(accountAId, created.id);
    expect(deleted.id).toBe(created.id);
    await expect(
      prisma.contact.findUnique({ where: { id: created.id }, select: { id: true } }),
    ).resolves.toBeNull();
  });

  it("rejects contact mutations for a company without an account opportunity", async () => {
    await expect(
      createContactForAccount(accountAId, {
        companyId: foreignCompanyId,
        firstName: "Fremd",
        lastName: "Neu",
        role: "CEO",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      updateContactForAccount(accountAId, foreignContactId, { firstName: "X" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(deleteContactForAccount(accountAId, foreignContactId)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    await expect(
      createContactForAccount(accountBId, {
        companyId,
        firstName: "B",
        lastName: "User",
        role: "CIO",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("does not remove a contact referenced by a todo", async ({ skip }) => {
    let todoId = "";
    try {
      const todo = await createSalesTodo(accountAId, {
        opportunityId: opportunityAId,
        companyId,
        title: "CIO nachfassen",
        dueAt: new Date("2026-10-08T09:00:00.000Z"),
        contactId: otherContactId,
      });
      todoId = todo.id;
    } catch (error) {
      skip(isMissingSalesTodoTable(error));
      throw error;
    }

    await expect(deleteContactForAccount(accountAId, otherContactId)).rejects.toBeInstanceOf(
      ConflictError,
    );
    const still = await prisma.activity.findUnique({
      where: { id: activityAId },
      select: { contactId: true },
    });
    expect(still?.contactId).toBe(otherContactId);
    if (todoId) {
      await prisma.salesTodo.delete({ where: { id: todoId } });
    }
  });
});
