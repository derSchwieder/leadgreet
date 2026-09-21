import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCompany } from "./companies";
import { createOpportunity } from "./opportunities";
import { listRadarPoints } from "./radar";
import { createSignal } from "./signals";
import { prisma } from "./client";
import { RADAR_POINT_FIELDS } from "@/lib/radar/types";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("radar tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let accountAId = "";
  let accountBId = "";
  let mappedCompanyId = "";
  let unmappedCompanyId = "";
  let opportunityAId = "";

  beforeAll(async () => {
    const [accountA, accountB, mapped, unmapped] = await Promise.all([
      prisma.account.create({
        data: { name: "Radar Account A", slug: `test-radar-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: "Radar Account B", slug: `test-radar-b-${suffix}` },
      }),
      createCompany({
        name: `Radar Mapped ${suffix}`,
        city: "Nürnberg",
        country: "Deutschland",
        website: "https://example.com",
      }),
      createCompany({
        name: `Radar Unmapped ${suffix}`,
        city: "Atlantis",
        country: "Deutschland",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    mappedCompanyId = mapped.id;
    unmappedCompanyId = unmapped.id;

    const signal = await createSignal({
      companyId: mapped.id,
      type: "AI_PROJECT",
      title: `[DEMO] Radar signal ${suffix}`,
    });

    const [opportunityA, opportunityB] = await Promise.all([
      createOpportunity({
        accountId: accountAId,
        companyId: mapped.id,
        title: `Radar Opp A ${suffix}`,
        signalIds: [signal.id],
      }),
      createOpportunity({
        accountId: accountBId,
        companyId: mapped.id,
        title: `Radar Opp B ${suffix}`,
        signalIds: [signal.id],
      }),
      createOpportunity({
        accountId: accountAId,
        companyId: unmapped.id,
        title: `Radar Opp Unmapped ${suffix}`,
      }),
    ]);
    opportunityAId = opportunityA.id;

    await prisma.opportunity.update({
      where: { id: opportunityA.id },
      data: { opportunityScore: 73 },
    });
    await prisma.opportunity.update({
      where: { id: opportunityB.id },
      data: { opportunityScore: 41 },
    });
  });

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length > 0) {
      await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
      await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    }
    const companyIds = [mappedCompanyId, unmappedCompanyId].filter(Boolean);
    if (companyIds.length > 0) {
      await prisma.signal.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
  });

  it("returns only companies that have an opportunity for the current account", async () => {
    const forA = await listRadarPoints(accountAId);
    const forB = await listRadarPoints(accountBId);

    expect(forA.map((point) => point.companyId)).toEqual([mappedCompanyId]);
    expect(forB.map((point) => point.companyId)).toEqual([mappedCompanyId]);
    expect(forA[0]?.greet).toBe(73);
    expect(forB[0]?.greet).toBe(41);
    expect(forA[0]?.website).toBe("https://example.com");
    expect(forB[0]?.website).toBe("https://example.com");
  });

  it("exposes only the radar payload fields", async () => {
    const [point] = await listRadarPoints(accountAId);
    expect(point).toBeDefined();
    expect(Object.keys(point!).sort()).toEqual([...RADAR_POINT_FIELDS].sort());
    expect(point).not.toHaveProperty("accountId");
  });

  it("uses the stored opportunityScore as greet", async () => {
    const stored = await prisma.opportunity.findUniqueOrThrow({
      where: { id: opportunityAId },
      select: { opportunityScore: true },
    });
    const [point] = await listRadarPoints(accountAId);
    expect(point?.greet).toBe(stored.opportunityScore);
    expect(point?.greet).toBe(73);
  });

  it("omits a company without demo coordinates", async () => {
    const points = await listRadarPoints(accountAId);
    expect(points.some((point) => point.companyId === unmappedCompanyId)).toBe(false);
  });
});
