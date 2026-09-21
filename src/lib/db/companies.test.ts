import { afterAll, describe, expect, it, vi } from "vitest";
import { createCompany, updateCompany } from "./companies";
import { geocodeAndCacheCompany } from "./geocoding";
import { prisma } from "./client";
import type { GeocodingProvider } from "@/lib/geocoding";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("company geo cache invalidation", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.company.deleteMany({ where: { id: { in: createdIds } } });
    }
  });

  async function companyWithCache(city: string, country: string) {
    const created = await createCompany({
      name: `Test Geo Invalidate ${city} ${suffix}`,
      city,
      country,
      industry: "manufacturing",
    });
    createdIds.push(created.id);

    expect(created.latitude).toBeNull();
    expect(created.longitude).toBeNull();
    expect(created.geocodedAt).toBeNull();

    const provider: GeocodingProvider = {
      name: "mock",
      geocodeCityCountry: vi.fn(async () => ({ latitude: 49.4521, longitude: 11.0767 })),
    };
    const now = new Date("2026-09-17T16:30:00.000Z");
    await geocodeAndCacheCompany(created.id, provider, now);
    return created.id;
  }

  it("clears latitude, longitude and geocodedAt when city changes", async () => {
    const id = await companyWithCache("Nürnberg", "Deutschland");
    const updated = await updateCompany(id, { city: "Memmingen" });

    expect(updated.city).toBe("Memmingen");
    expect(updated.country).toBe("Deutschland");
    expect(updated.latitude).toBeNull();
    expect(updated.longitude).toBeNull();
    expect(updated.geocodedAt).toBeNull();
  });

  it("clears latitude, longitude and geocodedAt when country changes", async () => {
    const id = await companyWithCache("Würzburg", "Deutschland");
    const updated = await updateCompany(id, { country: "Österreich" });

    expect(updated.city).toBe("Würzburg");
    expect(updated.country).toBe("Österreich");
    expect(updated.latitude).toBeNull();
    expect(updated.longitude).toBeNull();
    expect(updated.geocodedAt).toBeNull();
  });

  it("keeps the geo cache when another company field changes", async () => {
    const id = await companyWithCache("Herzogenaurach", "Deutschland");
    const updated = await updateCompany(id, { industry: "automotive" });

    expect(updated.industry).toBe("automotive");
    expect(updated.city).toBe("Herzogenaurach");
    expect(updated.country).toBe("Deutschland");
    expect(updated.latitude).toBeCloseTo(49.4521, 4);
    expect(updated.longitude).toBeCloseTo(11.0767, 4);
    expect(updated.geocodedAt).not.toBeNull();
  });

  it("keeps the geo cache when city and country stay the same", async () => {
    const id = await companyWithCache("Klingenberg", "Deutschland");
    const updated = await updateCompany(id, {
      city: "Klingenberg",
      country: "Deutschland",
      name: `Test Geo Invalidate Klingenberg ${suffix} renamed`,
    });

    expect(updated.name).toContain("renamed");
    expect(updated.city).toBe("Klingenberg");
    expect(updated.country).toBe("Deutschland");
    expect(updated.latitude).toBeCloseTo(49.4521, 4);
    expect(updated.longitude).toBeCloseTo(11.0767, 4);
    expect(updated.geocodedAt).not.toBeNull();
  });

  it("does not write coordinates on create", async () => {
    const created = await createCompany({
      name: `Test Geo Create ${suffix}`,
      city: "Wolnzach",
      country: "Deutschland",
    });
    createdIds.push(created.id);

    expect(created.city).toBe("Wolnzach");
    expect(created.country).toBe("Deutschland");
    expect(created.latitude).toBeNull();
    expect(created.longitude).toBeNull();
    expect(created.geocodedAt).toBeNull();
  });
});
