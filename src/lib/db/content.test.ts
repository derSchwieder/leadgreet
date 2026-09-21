import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCompany } from "./companies";
import {
  createContentItem,
  deleteContentItem,
  getContentItemById,
  listActiveContentItems,
  listContentItems,
  updateContentItem,
} from "./content";
import { createService } from "./services";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("content library tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let accountAId = "";
  let accountBId = "";
  let companyId = "";
  let serviceA1Id = "";
  let serviceA2Id = "";
  let serviceBId = "";
  let contentAId = "";

  beforeAll(async () => {
    const [accountA, accountB, company] = await Promise.all([
      prisma.account.create({
        data: { name: "Content Account A", slug: `test-content-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "Content Account B", slug: `test-content-b-${suffix}` },
      }),
      createCompany({
        name: `Test Content Co ${suffix}`,
        industry: "manufacturing",
        country: "Germany",
        employees: 400,
        companySize: "LARGE",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;

    const [serviceA1, serviceA2, serviceB] = await Promise.all([
      createService(accountAId, { name: "KI-Navigator" }),
      createService(accountAId, { name: "Data & AI" }),
      createService(accountBId, { name: "Cloud Infrastructure" }),
    ]);
    serviceA1Id = serviceA1.id;
    serviceA2Id = serviceA2.id;
    serviceBId = serviceB.id;

    const created = await createContentItem(accountAId, {
      name: "KI-Navigator – One-Pager",
      type: "ONE_PAGER",
      tags: ["KI", "Assessment"],
      businessCaseTypes: ["COST_REDUCTION", "CAPACITY"],
      serviceIds: [serviceA1Id],
    });
    contentAId = created.id;
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length === 0) return;
    await prisma.contentItem.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.service.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    if (companyId) {
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
  }, 30000);

  it("can create, read, update and delete a content item", async () => {
    const created = await createContentItem(accountAId, {
      name: "Temporärer One-Pager",
      type: "ONE_PAGER",
      description: "Demo-Metadaten ohne konkrete Kundenerfolge.",
    });
    const loaded = await getContentItemById(accountAId, created.id);
    expect(loaded.name).toBe("Temporärer One-Pager");
    expect(loaded.type).toBe("ONE_PAGER");

    const updated = await updateContentItem(accountAId, created.id, {
      name: "Aktualisierter One-Pager",
      tags: ["KI"],
    });
    expect(updated.name).toBe("Aktualisierter One-Pager");
    expect(updated.tags).toEqual(["KI"]);

    await deleteContentItem(accountAId, created.id);
    await expect(getContentItemById(accountAId, created.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets account A read its own content", async () => {
    const items = await listContentItems(accountAId);
    expect(items.some((item) => item.id === contentAId)).toBe(true);
    expect(items.every((item) => item.accountId === accountAId)).toBe(true);
  });

  it("does not let account B read account A content", async () => {
    const items = await listContentItems(accountBId);
    expect(items.some((item) => item.id === contentAId)).toBe(false);
    await expect(getContentItemById(accountBId, contentAId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("does not let account B update account A content", async () => {
    await expect(
      updateContentItem(accountBId, contentAId, { name: "Übernommen" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    const stillA = await getContentItemById(accountAId, contentAId);
    expect(stillA.name).toBe("KI-Navigator – One-Pager");
  });

  it("does not let account B delete account A content", async () => {
    await expect(deleteContentItem(accountBId, contentAId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getContentItemById(accountAId, contentAId)).resolves.toMatchObject({
      id: contentAId,
    });
  });

  it("can assign multiple content items to the same service", async () => {
    const second = await createContentItem(accountAId, {
      name: "KI-Navigator – Präsentation",
      type: "PRESENTATION",
      serviceIds: [serviceA1Id],
    });
    const items = await listContentItems(accountAId, { serviceId: serviceA1Id });
    expect(items.map((item) => item.name).sort()).toEqual([
      "KI-Navigator – One-Pager",
      "KI-Navigator – Präsentation",
    ]);
    await deleteContentItem(accountAId, second.id);
  });

  it("can assign multiple services to one content item", async () => {
    const updated = await updateContentItem(accountAId, contentAId, {
      serviceIds: [serviceA1Id, serviceA2Id],
    });
    expect(updated.services.map((service) => service.name).sort()).toEqual([
      "Data & AI",
      "KI-Navigator",
    ]);
  });

  it("does not attach another account's service", async () => {
    await expect(
      updateContentItem(accountAId, contentAId, { serviceIds: [serviceBId] }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("stores multiple business case types", async () => {
    const updated = await updateContentItem(accountAId, contentAId, {
      businessCaseTypes: ["COST_REDUCTION", "CAPACITY", "REVENUE_GROWTH"],
    });
    expect(updated.businessCaseTypes.sort()).toEqual([
      "CAPACITY",
      "COST_REDUCTION",
      "REVENUE_GROWTH",
    ]);
  });

  it("stores tags", async () => {
    const updated = await updateContentItem(accountAId, contentAId, {
      tags: ["KI", "Strategie", "Assessment"],
    });
    expect(updated.tags).toEqual(["KI", "Strategie", "Assessment"]);
  });

  it("filters inactive content from the active list", async () => {
    await updateContentItem(accountAId, contentAId, { isActive: false });
    const active = await listActiveContentItems(accountAId);
    expect(active.some((item) => item.id === contentAId)).toBe(false);
    const all = await listContentItems(accountAId);
    expect(all.find((item) => item.id === contentAId)?.isActive).toBe(false);
    await updateContentItem(accountAId, contentAId, { isActive: true });
  });
});
