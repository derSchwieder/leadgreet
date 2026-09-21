import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createCompany } from "./companies";
import { geocodeAndCacheCompany } from "./geocoding";
import { prisma } from "./client";
import { serializeCompany } from "./serialize";
import type { GeocodingProvider } from "@/lib/geocoding";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("geocode cache persistence", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let companyId = "";

  beforeAll(async () => {
    const company = await createCompany({
      name: `Test Geo Co ${suffix}`,
      city: "Würzburg",
      country: "Deutschland",
    });
    companyId = company.id;
  });

  afterAll(async () => {
    if (companyId) {
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
  });

  it("persists coordinates and geocodedAt only after a successful geocode", async () => {
    const now = new Date("2026-09-17T16:00:00.000Z");
    const provider: GeocodingProvider = {
      name: "mock",
      geocodeCityCountry: vi.fn(async (city, country) => {
        expect(city).toBe("Würzburg");
        expect(country).toBe("Deutschland");
        return { latitude: 49.7913, longitude: 9.9534 };
      }),
    };

    const attempt = await geocodeAndCacheCompany(companyId, provider, now);
    const stored = serializeCompany(
      await prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    );

    expect(attempt.status).toBe("geocoded");
    expect(stored.latitude).toBeCloseTo(49.7913, 4);
    expect(stored.longitude).toBeCloseTo(9.9534, 4);
    expect(stored.geocodedAt?.toISOString()).toBe(now.toISOString());
    expect(stored.city).toBe("Würzburg");
    expect(stored.country).toBe("Deutschland");
  });

  it("does not persist coordinates when the provider fails", async () => {
    const failedCompany = await createCompany({
      name: `Test Geo Fail ${suffix}`,
      city: "Wolnzach",
      country: "Deutschland",
    });

    try {
      const provider: GeocodingProvider = {
        name: "mock",
        geocodeCityCountry: vi.fn(async () => {
          throw new Error("provider down");
        }),
      };

      const attempt = await geocodeAndCacheCompany(failedCompany.id, provider);
      const stored = serializeCompany(
        await prisma.company.findUniqueOrThrow({ where: { id: failedCompany.id } }),
      );

      expect(attempt.status).toBe("failed");
      expect(stored.latitude).toBeNull();
      expect(stored.longitude).toBeNull();
      expect(stored.geocodedAt).toBeNull();
    } finally {
      await prisma.company.deleteMany({ where: { id: failedCompany.id } });
    }
  });
});
