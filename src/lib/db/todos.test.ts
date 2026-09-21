import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createActivity } from "./activities";
import { createCompany } from "./companies";
import { createContact } from "./contacts";
import { createOpportunity } from "./opportunities";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";
import {
  completeSalesTodo,
  createSalesTodo,
  getSalesTodoById,
  isMissingSalesTodoTable,
  listSalesTodos,
} from "./todos";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("sales todo tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let tableReady = false;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";
  let opportunityAId = "";
  let opportunityBId = "";
  let contactId = "";
  let activityAId = "";

  beforeAll(async () => {
    const [accountA, accountB, company] = await Promise.all([
      prisma.account.create({
        data: { name: "Todo Account A", slug: `test-todo-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "Todo Account B", slug: `test-todo-b-${suffix}` },
      }),
      createCompany({
        name: `Todo Co ${suffix}`,
        industry: "manufacturing",
        country: "Germany",
        employees: 240,
        companySize: "MEDIUM",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;

    const [opportunityA, opportunityB, contact] = await Promise.all([
      createOpportunity({
        accountId: accountAId,
        companyId,
        title: `Todo Opp A ${suffix}`,
      }),
      createOpportunity({
        accountId: accountBId,
        companyId,
        title: `Todo Opp B ${suffix}`,
      }),
      createContact({
        companyId,
        firstName: "Herr",
        lastName: "Meier",
        role: "CIO",
        isDecisionMaker: true,
      }),
    ]);
    opportunityAId = opportunityA.id;
    opportunityBId = opportunityB.id;
    contactId = contact.id;

    const activity = await createActivity(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      type: "CALL",
      subject: "Anruf mit CDO",
      occurredAt: new Date("2026-09-22T09:00:00.000Z"),
    });
    activityAId = activity.id;

    try {
      await prisma.salesTodo.findMany({ take: 1 });
      tableReady = true;
    } catch (error) {
      tableReady = !isMissingSalesTodoTable(error);
    }
  }, 30000);

  afterAll(async () => {
    if (!accountAId && !accountBId) return;
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (tableReady) {
      await prisma.salesTodo.deleteMany({ where: { accountId: { in: accountIds } } });
    }
    await prisma.activity.updateMany({
      where: { accountId: { in: accountIds } },
      data: { responseToActivityId: null },
    });
    await prisma.activity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.scoreBreakdown.deleteMany({
      where: { opportunity: { accountId: { in: accountIds } } },
    });
    await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    if (companyId) {
      await prisma.contact.deleteMany({ where: { companyId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
  }, 30000);

  it("can create a todo for an owned opportunity", async ({ skip }) => {
    skip(!tableReady);
    const created = await createSalesTodo(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      title: "CIO Herrn Meier kontaktieren",
      dueAt: new Date("2026-10-02T09:00:00.000Z"),
      contactId,
      relatedActivityId: activityAId,
    });
    expect(created.accountId).toBe(accountAId);
    expect(created.opportunityId).toBe(opportunityAId);
    expect(created.status).toBe("OPEN");
    expect(created.completedAt).toBeNull();
    expect(created.contactId).toBe(contactId);
    expect(created.relatedActivityId).toBe(activityAId);

    const listed = await listSalesTodos(accountAId, opportunityAId);
    expect(listed.some((row) => row.id === created.id)).toBe(true);
  });

  it("rejects a todo for a foreign opportunity", async ({ skip }) => {
    skip(!tableReady);
    await expect(
      createSalesTodo(accountBId, {
        opportunityId: opportunityAId,
        companyId,
        title: "Fremdes To-do",
        dueAt: new Date("2026-10-03T09:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a todo attached to a contact that does not belong to the company", async ({ skip }) => {
    skip(!tableReady);
    await expect(
      createSalesTodo(accountAId, {
        opportunityId: opportunityAId,
        companyId,
        title: "Fremden Kontakt verwenden",
        dueAt: new Date("2026-10-03T12:00:00.000Z"),
        contactId: "c-foreign",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("can complete a todo without creating an activity", async ({ skip }) => {
    skip(!tableReady);
    const created = await createSalesTodo(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      title: "Passenden Inhalt senden",
      dueAt: new Date("2026-10-04T09:00:00.000Z"),
    });
    const completed = await completeSalesTodo(accountAId, created.id);
    expect(completed.status).toBe("DONE");
    expect(completed.completedAt).not.toBeNull();

    const activities = await prisma.activity.findMany({
      where: { accountId: accountAId, opportunityId: opportunityAId },
    });
    expect(activities.some((row) => row.note === created.title && row.id !== activityAId)).toBe(
      false,
    );
  });

  it("does not let account B complete account A's todo", async ({ skip }) => {
    skip(!tableReady);
    const created = await createSalesTodo(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      title: "Nur intern",
      dueAt: new Date("2026-10-05T09:00:00.000Z"),
    });
    await expect(completeSalesTodo(accountBId, created.id)).rejects.toBeInstanceOf(NotFoundError);
    const still = await getSalesTodoById(accountAId, created.id);
    expect(still.status).toBe("OPEN");
  });

  it("can take over a next step as a todo", async ({ skip }) => {
    skip(!tableReady);
    const created = await createSalesTodo(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      title: "Passenden Inhalt senden",
      dueAt: new Date("2026-10-06T00:00:00.000Z"),
    });
    expect(created.title).toBe("Passenden Inhalt senden");
    expect(created.status).toBe("OPEN");
  });

  it("can create a todo with only title and due date", async ({ skip }) => {
    skip(!tableReady);
    const created = await createSalesTodo(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      title: "nachrufen",
      dueAt: new Date("2026-09-30T12:30:00.000Z"),
    });
    expect(created.contactId).toBeNull();
    expect(created.relatedActivityId).toBeNull();
    expect(created.status).toBe("OPEN");
  });
});
