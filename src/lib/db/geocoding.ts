import { geocodeCompany, type GeocodeAttempt, type GeocodingProvider } from "@/lib/geocoding";
import { prisma } from "./client";
import { NotFoundError, serializeCompany } from "./serialize";

function toGeoState(company: ReturnType<typeof serializeCompany>) {
  return {
    city: company.city,
    country: company.country,
    latitude: company.latitude,
    longitude: company.longitude,
    geocodedAt: company.geocodedAt,
  };
}

/**
 * Geocode one company and persist coordinates only on success.
 * Does not batch-geocode seed companies. Caller must pass an injected provider.
 */
export async function geocodeAndCacheCompany(
  companyId: string,
  provider: GeocodingProvider,
  now: Date = new Date(),
): Promise<GeocodeAttempt> {
  const row = await prisma.company.findUnique({ where: { id: companyId } });
  if (!row) {
    throw new NotFoundError("Company", companyId);
  }

  const company = serializeCompany(row);
  const attempt = await geocodeCompany(toGeoState(company), provider, now);

  if (attempt.status !== "geocoded") {
    return attempt;
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      latitude: attempt.latitude,
      longitude: attempt.longitude,
      geocodedAt: attempt.geocodedAt,
    },
  });

  return attempt;
}
