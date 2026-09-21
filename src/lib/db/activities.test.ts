import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createActivity,
  deleteActivity,
  getActivityById,
  listActivities,
  updateActivity,
} from "./activities";
import { createCompany } from "./companies";
import { createContact } from "./contacts";
import { createOpportunity, getOpportunityById, updateOpportunityStatus } from "./opportunities";
import { createStatusHistory, listStatusHistory } from "./opportunity-status-history";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("activity tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";
  let opportunityAId = "";
  let opportunityBId = "";
  let activityAId = "";
  let recommendedContactId = "";
  let otherContactId = "";
  let foreignContactId = "";
  let otherCompanyId = "";

  beforeAll(async () => {
    const [accountA, accountB, company, otherCompany] = await Promise.all([
      prisma.account.create({
        data: { name: "Test Account A", slug: `test-act-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "Test Account B", slug: `test-act-b-${suffix}` },
      }),
      createCompany({
        name: `Test Activity Co ${suffix}`,
        industry: "manufacturing",
        country: "Germany",
        employees: 200,
        companySize: "MEDIUM",
      }),
      createCompany({
        name: `Foreign Activity Co ${suffix}`,
        industry: "logistics",
        country: "Germany",
        employees: 80,
        companySize: "SMALL",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;
    otherCompanyId = otherCompany.id;

    const [recommendedContact, otherContact, foreignContact] = await Promise.all([
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
        companyId: otherCompany.id,
        firstName: "Fremd",
        lastName: "Kontakt",
        role: "CEO",
      }),
    ]);
    recommendedContactId = recommendedContact.id;
    otherContactId = otherContact.id;
    foreignContactId = foreignContact.id;

    const [opportunityA, opportunityB] = await Promise.all([
      createOpportunity({
        accountId: accountAId,
        companyId,
        title: `Opp A ${suffix}`,
        recommendedContactId: recommendedContact.id,
      }),
      createOpportunity({
        accountId: accountBId,
        companyId,
        title: `Opp B ${suffix}`,
      }),
    ]);
    opportunityAId = opportunityA.id;
    opportunityBId = opportunityB.id;

    const activity = await createActivity(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      type: "EMAIL_SENT",
      subject: "Erstansprache",
      occurredAt: new Date("2026-09-12T08:00:00.000Z"),
      outcome: "NO_RESPONSE",
    });
    activityAId = activity.id;
  }, 30000);

  afterAll(async () => {
    if (!accountAId && !accountBId) return;
    const accountIds = [accountAId, accountBId].filter(Boolean);
    await prisma.activity.updateMany({
      where: { accountId: { in: accountIds } },
      data: { responseToActivityId: null },
    });
    await prisma.activity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.opportunityStatusHistory.deleteMany({
      where: { accountId: { in: accountIds } },
    });
    await prisma.scoreBreakdown.deleteMany({
      where: { opportunity: { accountId: { in: accountIds } } },
    });
    await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    if (companyId) {
      await prisma.contact.deleteMany({ where: { companyId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
    if (otherCompanyId) {
      await prisma.contact.deleteMany({ where: { companyId: otherCompanyId } });
      await prisma.company.deleteMany({ where: { id: otherCompanyId } });
    }
  }, 30000);

  it("can create, read, update and delete an activity", async () => {
    const created = await createActivity(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      type: "NOTE",
      subject: "Interne Notiz",
      occurredAt: new Date("2026-09-13T09:00:00.000Z"),
    });
    const loaded = await getActivityById(accountAId, created.id);
    expect(loaded.subject).toBe("Interne Notiz");

    const updated = await updateActivity(accountAId, created.id, {
      subject: "Aktualisierte Notiz",
      outcome: "OTHER",
    });
    expect(updated.subject).toBe("Aktualisierte Notiz");
    expect(updated.outcome).toBe("OTHER");

    await deleteActivity(accountAId, created.id);
    await expect(getActivityById(accountAId, created.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("stores outcome including explicit NO_RESPONSE", async () => {
    const loaded = await getActivityById(accountAId, activityAId);
    expect(loaded.outcome).toBe("NO_RESPONSE");
    expect(loaded.type).toBe("EMAIL_SENT");
  });

  it("can point an activity at a previous activity", async () => {
    const followUp = await createActivity(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      type: "FOLLOW_UP",
      subject: "Follow-up nach Erstansprache",
      occurredAt: new Date("2026-09-16T09:00:00.000Z"),
      outcome: "NO_RESPONSE",
      responseToActivityId: activityAId,
    });
    expect(followUp.responseToActivityId).toBe(activityAId);
    await deleteActivity(accountAId, followUp.id);
  });

  it("does not list account A activities for account B", async () => {
    const forB = await listActivities(accountBId);
    expect(forB.some((row) => row.id === activityAId)).toBe(false);
    const forA = await listActivities(accountAId, opportunityAId);
    expect(forA.some((row) => row.id === activityAId)).toBe(true);
  });

  it("does not let account B read an activity of account A", async () => {
    await expect(getActivityById(accountBId, activityAId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("does not let account B update an activity of account A", async () => {
    await expect(
      updateActivity(accountBId, activityAId, { subject: "Hijack" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    const still = await getActivityById(accountAId, activityAId);
    expect(still.subject).toBe("Erstansprache");
  });

  it("does not let account B delete an activity of account A", async () => {
    await expect(deleteActivity(accountBId, activityAId)).rejects.toBeInstanceOf(NotFoundError);
    const still = await getActivityById(accountAId, activityAId);
    expect(still.id).toBe(activityAId);
  });

  it("does not let account B create an activity on account A's opportunity", async () => {
    await expect(
      createActivity(accountBId, {
        opportunityId: opportunityAId,
        companyId,
        type: "CALL",
        occurredAt: new Date("2026-09-20T10:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const own = await createActivity(accountBId, {
      opportunityId: opportunityBId,
      companyId,
      type: "NOTE",
      subject: "Account B own note",
      occurredAt: new Date("2026-09-20T11:00:00.000Z"),
    });
    expect(own.accountId).toBe(accountBId);
    await deleteActivity(accountBId, own.id);
  });

  it("lists a newly created activity first for the owning opportunity", async () => {
    const created = await createActivity(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      type: "FOLLOW_UP",
      note: "Follow-up prüfen",
      occurredAt: new Date("2026-09-21T16:00:00.000Z"),
    });
    const listed = await listActivities(accountAId, opportunityAId);
    expect(listed[0]?.id).toBe(created.id);
    expect(listed[0]?.note).toBe("Follow-up prüfen");
    expect(listed[0]?.accountId).toBe(accountAId);
    await deleteActivity(accountAId, created.id);
  });

  it("can create and list status history for the owning account", async () => {
    const created = await createStatusHistory(accountAId, {
      opportunityId: opportunityAId,
      fromStatus: "NEW",
      toStatus: "CONTACTED",
      note: "Nach Erstansprache",
      changedAt: new Date("2026-09-12T08:30:00.000Z"),
    });
    expect(created.toStatus).toBe("CONTACTED");
    const history = await listStatusHistory(accountAId, opportunityAId);
    expect(history.some((row) => row.id === created.id)).toBe(true);
  });

  it("does not let account B read or write status history of account A", async () => {
    await expect(listStatusHistory(accountBId, opportunityAId)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      createStatusHistory(accountBId, {
        opportunityId: opportunityAId,
        toStatus: "LOST",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updates opportunity status and writes history for the owning account", async () => {
    const updated = await updateOpportunityStatus(
      accountAId,
      opportunityAId,
      "REVIEWED",
      "Manuell geprüft",
    );
    expect(updated.status).toBe("REVIEWED");
    const history = await listStatusHistory(accountAId, opportunityAId);
    expect(
      history.some(
        (row) =>
          row.toStatus === "REVIEWED" &&
          row.fromStatus === "NEW" &&
          row.note === "Manuell geprüft",
      ),
    ).toBe(true);
  });

  it("does not let account B change account A's opportunity status", async () => {
    await expect(
      updateOpportunityStatus(accountBId, opportunityAId, "LOST"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("can attach an existing company contact to an activity", async () => {
    const created = await createActivity(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      type: "CALL",
      subject: "Anruf mit CDO",
      occurredAt: new Date("2026-09-22T09:00:00.000Z"),
      contactId: recommendedContactId,
      outcome: "NOT_REACHABLE",
    });
    expect(created.contactId).toBe(recommendedContactId);
    await deleteActivity(accountAId, created.id);
  });

  it("can store a different activity contact than the intelligence contact", async () => {
    const created = await createActivity(accountAId, {
      opportunityId: opportunityAId,
      companyId,
      type: "CALL",
      subject: "Anruf mit CIO",
      occurredAt: new Date("2026-09-22T10:00:00.000Z"),
      contactId: otherContactId,
    });
    expect(created.contactId).toBe(otherContactId);
    expect(created.contactId).not.toBe(recommendedContactId);

    const opportunity = await getOpportunityById(opportunityAId, accountAId);
    expect(opportunity.recommendedContactId).toBe(recommendedContactId);
    await deleteActivity(accountAId, created.id);
  });

  it("rejects a contact that does not belong to the opportunity company", async () => {
    await expect(
      createActivity(accountAId, {
        opportunityId: opportunityAId,
        companyId,
        type: "NOTE",
        occurredAt: new Date("2026-09-22T11:00:00.000Z"),
        contactId: foreignContactId,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
