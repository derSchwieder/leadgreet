import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCompany } from "./companies";
import { getCompanyGreet } from "./company-greet";
import { createOpportunity } from "./opportunities";
import { listRadarPoints } from "./radar";
import { createSignal } from "./signals";
import { prisma } from "./client";
import { filterVisibleRadarPoints } from "@/lib/radar/sensitivity";
import { RADAR_POINT_FIELDS } from "@/lib/radar/types";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("radar tenant isolation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let accountAId = "";
  let accountBId = "";
  let mappedCompanyId = "";
  let unmappedCompanyId = "";
  let soloCompanyId = "";
  let hartingCompanyId = "";
  let opportunityAId = "";

  beforeAll(async () => {
    const [accountA, accountB, mapped, unmapped, solo, harting] = await Promise.all([
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
      createCompany({
        name: `Radar Solo ${suffix}`,
        city: "Nürnberg",
        country: "Deutschland",
      }),
      createCompany({
        name: `Radar HARTING ${suffix}`,
        city: "Espelkamp",
        country: "Deutschland",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    mappedCompanyId = mapped.id;
    unmappedCompanyId = unmapped.id;
    soloCompanyId = solo.id;
    hartingCompanyId = harting.id;

    await prisma.company.update({
      where: { id: harting.id },
      data: { latitude: 52.3775, longitude: 8.6231 },
    });

    const [mappedSignal] = await Promise.all([
      createSignal({
        companyId: mapped.id,
        type: "AI_PROJECT",
        title: `[DEMO] Radar signal ${suffix}`,
        detectedAt: new Date("2026-09-08T12:00:00.000Z"),
        eventDate: new Date("2026-09-08T12:00:00.000Z"),
      }),
      createSignal({
        companyId: solo.id,
        type: "ERP_TRANSFORMATION",
        title: `Solo current signal ${suffix}`,
        detectedAt: new Date("2026-09-02T12:00:00.000Z"),
        eventDate: new Date("2026-09-02T12:00:00.000Z"),
      }),
      createSignal({
        companyId: unmapped.id,
        type: "AI_PROJECT",
        title: `Unmapped signal ${suffix}`,
      }),
      createSignal({
        companyId: harting.id,
        type: "ERP_TRANSFORMATION",
        title: `HARTING RISE ${suffix}`,
        detectedAt: new Date("2026-09-02T12:00:00.000Z"),
        eventDate: new Date("2026-09-02T12:00:00.000Z"),
      }),
    ]);

    const [opportunityA] = await Promise.all([
      createOpportunity({
        accountId: accountAId,
        companyId: mapped.id,
        title: `Radar Opp A ${suffix}`,
        signalIds: [mappedSignal.id],
      }),
      createOpportunity({
        accountId: accountBId,
        companyId: mapped.id,
        title: `Radar Opp B ${suffix}`,
        signalIds: [mappedSignal.id],
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
  });

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length > 0) {
      await prisma.opportunity.deleteMany({ where: { accountId: { in: accountIds } } });
      await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    }
    const companyIds = [mappedCompanyId, unmappedCompanyId, soloCompanyId, hartingCompanyId].filter(
      Boolean,
    );
    if (companyIds.length > 0) {
      await prisma.signal.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
  });

  it("E: includes a company without an opportunity when it has coordinates", async () => {
    const points = await listRadarPoints(accountAId);
    const solo = points.find((point) => point.companyId === soloCompanyId);
    const harting = points.find((point) => point.companyId === hartingCompanyId);
    const opportunityCount = await prisma.opportunity.count({
      where: { companyId: { in: [soloCompanyId, hartingCompanyId] } },
    });

    expect(opportunityCount).toBe(0);
    expect(solo).toBeDefined();
    expect(solo?.greet).toBeGreaterThan(0);
    expect(harting).toBeDefined();
    expect(harting?.greet).toBeGreaterThan(0);
  });

  it("uses Company-Greet rather than a stored opportunity snapshot", async () => {
    const stored = await prisma.opportunity.findUniqueOrThrow({
      where: { id: opportunityAId },
      select: { opportunityScore: true },
    });
    const companyGreet = await getCompanyGreet(mappedCompanyId, new Date("2026-09-22T12:00:00.000Z"));
    const [forA, forB] = await Promise.all([
      listRadarPoints(accountAId),
      listRadarPoints(accountBId),
    ]);
    const pointA = forA.find((point) => point.companyId === mappedCompanyId);
    const pointB = forB.find((point) => point.companyId === mappedCompanyId);

    expect(stored.opportunityScore).toBe(73);
    expect(pointA?.greet).toBe(companyGreet.opportunityScore);
    expect(pointB?.greet).toBe(companyGreet.opportunityScore);
    expect(pointA?.greet).not.toBe(73);
    expect(pointA?.website).toBe("https://example.com");
  });

  it("exposes only the radar payload fields", async () => {
    const points = await listRadarPoints(accountAId);
    const point = points.find((item) => item.companyId === mappedCompanyId);
    expect(point).toBeDefined();
    expect(Object.keys(point!).sort()).toEqual([...RADAR_POINT_FIELDS].sort());
    expect(point).not.toHaveProperty("accountId");
  });

  it("omits a company without demo coordinates", async () => {
    const points = await listRadarPoints(accountAId);
    expect(points.some((point) => point.companyId === unmappedCompanyId)).toBe(false);
  });

  it("F: radar sensitivity still filters on Company-Greet", async () => {
    const points = await listRadarPoints(accountAId);
    const solo = points.find((point) => point.companyId === soloCompanyId);
    expect(solo).toBeDefined();

    const visibleAtZero = filterVisibleRadarPoints(points, 0);
    const visibleAbove = filterVisibleRadarPoints(points, (solo?.greet ?? 0) + 1);

    expect(visibleAtZero.some((point) => point.companyId === soloCompanyId)).toBe(true);
    expect(visibleAbove.some((point) => point.companyId === soloCompanyId)).toBe(false);
  });
});
