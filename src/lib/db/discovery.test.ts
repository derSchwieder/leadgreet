import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "./serialize";
import { prisma } from "./client";
import {
  dismissUnresolvedSignal,
  isMissingUnresolvedSignalTable,
  resolveUnresolvedSignal,
  reviewUnresolvedSignal,
} from "./discovery";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("UnresolvedSignal resolve", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let tableReady = true;
  const companyIds: string[] = [];
  const unresolvedIds: string[] = [];

  async function createDraft(title: string) {
    const row = await prisma.unresolvedSignal.create({
      data: {
        source: "test",
        sourceUrl: `https://example.com/${suffix}/${title}`,
        title,
        description: "Pilot",
        signalType: "AI_AGENT",
        detectedAt: new Date("2026-09-20T00:00:00.000Z"),
        companyNameRaw: "DATEV",
        domainRaw: "datev.de",
        status: "NEW",
      },
    });
    unresolvedIds.push(row.id);
    return row;
  }

  beforeAll(async () => {
    try {
      await createDraft(`Probe ${suffix}`);
    } catch (error) {
      tableReady = !isMissingUnresolvedSignalTable(error);
      if (tableReady) throw error;
    }
  }, 30000);

  afterAll(async () => {
    if (unresolvedIds.length > 0) {
      await prisma.unresolvedSignal.deleteMany({ where: { id: { in: unresolvedIds } } });
    }
    if (companyIds.length > 0) {
      await prisma.signal.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
  });

  it("resolves to an existing company and promotes a signal once", async () => {
    if (!tableReady) return;
    const company = await prisma.company.create({
      data: { name: `Discovery Existing ${suffix}` },
    });
    companyIds.push(company.id);
    const draft = await createDraft(`Existing match ${suffix}`);

    const resolved = await resolveUnresolvedSignal(draft.id, { companyId: company.id });
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolvedCompany?.id).toBe(company.id);
    expect(resolved.resolvedSignal?.title).toBe(draft.title);

    const signals = await prisma.signal.findMany({ where: { companyId: company.id } });
    expect(signals).toHaveLength(1);

    await expect(resolveUnresolvedSignal(draft.id, { companyId: company.id })).rejects.toThrow(
      ConflictError,
    );
    const after = await prisma.signal.findMany({ where: { companyId: company.id } });
    expect(after).toHaveLength(1);
  });

  it("creates a company from resolve and rejects an unknown company id", async () => {
    if (!tableReady) return;
    const draft = await createDraft(`Create company ${suffix}`);
    const resolved = await resolveUnresolvedSignal(draft.id, {
      createCompany: { name: `Discovery Created ${suffix}` },
    });
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolvedCompany?.name).toBe(`Discovery Created ${suffix}`);
    if (resolved.resolvedCompany) companyIds.push(resolved.resolvedCompany.id);

    const missing = await createDraft(`Missing company ${suffix}`);
    await expect(
      resolveUnresolvedSignal(missing.id, { companyId: "missing-company-id" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("reviews and dismisses from NEW, but not after resolve", async () => {
    if (!tableReady) return;
    const draft = await createDraft(`Review dismiss ${suffix}`);
    const reviewed = await reviewUnresolvedSignal(draft.id);
    expect(reviewed.status).toBe("REVIEWED");
    const dismissed = await dismissUnresolvedSignal(draft.id);
    expect(dismissed.status).toBe("DISMISSED");
    await expect(reviewUnresolvedSignal(draft.id)).rejects.toThrow(ConflictError);
  });
});
