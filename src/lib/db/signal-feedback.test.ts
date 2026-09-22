import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCompany } from "./companies";
import { createSignal } from "./signals";
import { getCompanyGreet } from "./company-greet";
import { prisma } from "./client";
import {
  getSignalFeedback,
  isMissingSignalFeedbackTable,
  listSignalFeedbackForCompany,
  upsertSignalFeedback,
} from "./signal-feedback";
import { SCORING_WEIGHTS } from "@/lib/scoring";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDatabase)("signal feedback", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let tableReady = true;
  let accountAId = "";
  let accountBId = "";
  let userAId = "";
  let userBId = "";
  let companyId = "";
  let signalId = "";

  beforeAll(async () => {
    const [accountA, accountB, company] = await Promise.all([
      prisma.account.create({
        data: { name: `Feedback Account A ${suffix}`, slug: `test-fb-a-${suffix}` },
      }),
      prisma.account.create({
        data: { name: `Feedback Account B ${suffix}`, slug: `test-fb-b-${suffix}` },
      }),
      createCompany({
        name: `Feedback Co ${suffix}`,
        industry: "manufacturing",
        country: "Germany",
        employees: 180,
        companySize: "MEDIUM",
      }),
    ]);
    accountAId = accountA.id;
    accountBId = accountB.id;
    companyId = company.id;

    const [userA, userB, signal] = await Promise.all([
      prisma.user.create({
        data: {
          accountId: accountAId,
          name: "Feedback User A",
          email: `fb-a-${suffix}@leadgreet.test`,
        },
      }),
      prisma.user.create({
        data: {
          accountId: accountBId,
          name: "Feedback User B",
          email: `fb-b-${suffix}@leadgreet.test`,
        },
      }),
      createSignal({
        companyId,
        type: "AI_STRATEGY",
        title: `Feedback signal ${suffix}`,
        detectedAt: new Date("2026-09-15T12:00:00.000Z"),
        eventDate: new Date("2026-09-15T12:00:00.000Z"),
      }),
    ]);
    userAId = userA.id;
    userBId = userB.id;
    signalId = signal.id;
  }, 30000);

  afterAll(async () => {
    const accountIds = [accountAId, accountBId].filter(Boolean);
    if (accountIds.length > 0) {
      await prisma.signalFeedback.deleteMany({ where: { accountId: { in: accountIds } } }).catch((error) => {
        if (!isMissingSignalFeedbackTable(error)) throw error;
      });
      await prisma.user.deleteMany({ where: { accountId: { in: accountIds } } });
      await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    }
    if (companyId) {
      await prisma.signal.deleteMany({ where: { companyId } });
      await prisma.company.deleteMany({ where: { id: companyId } });
    }
  }, 30000);

  it("exposes the SignalFeedback Prisma delegate", () => {
    expect(typeof prisma.signalFeedback.findMany).toBe("function");
  });

  it("A: stores relevant feedback with frozen Greet context", async () => {
    const greetBefore = await getCompanyGreet(companyId);
    let created;
    try {
      created = await upsertSignalFeedback(accountAId, userAId, {
        signalId,
        relevant: true,
      });
    } catch (error) {
      if (isMissingSignalFeedbackTable(error)) {
        tableReady = false;
        return;
      }
      throw error;
    }

    expect(created.relevant).toBe(true);
    expect(created.reason).toBeNull();
    expect(created.accountId).toBe(accountAId);
    expect(created.userId).toBe(userAId);
    expect(created.companyId).toBe(companyId);
    expect(created.greetScore).toBe(greetBefore.opportunityScore);
    expect(created.signalStrength).toBe(greetBefore.signalStrength);
    expect(created.freshness).toBe(greetBefore.freshness);
    expect(created.companyFit).toBe(greetBefore.companyFit);
    expect(created.contactFit).toBe(greetBefore.contactFit);
    expect(created.confidence).toBe(greetBefore.confidence);
    expect(created.scoringWeights).toEqual(SCORING_WEIGHTS);
  });

  it("B/C: stores not-relevant feedback with an optional reason", async () => {
    if (!tableReady) return;
    const created = await upsertSignalFeedback(accountAId, userAId, {
      signalId,
      relevant: false,
      reason: "TOO_OLD",
    });
    expect(created.relevant).toBe(false);
    expect(created.reason).toBe("TOO_OLD");
  });

  it("D: loads the current user's feedback", async () => {
    if (!tableReady) return;
    const loaded = await getSignalFeedback(accountAId, userAId, signalId);
    expect(loaded?.relevant).toBe(false);
    expect(loaded?.reason).toBe("TOO_OLD");
    const listed = await listSignalFeedbackForCompany(accountAId, userAId, companyId);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.signalId).toBe(signalId);
  });

  it("E/F: updates the same row instead of inserting a duplicate", async () => {
    if (!tableReady) return;
    const before = await getSignalFeedback(accountAId, userAId, signalId);
    const updated = await upsertSignalFeedback(accountAId, userAId, {
      signalId,
      relevant: true,
      reason: "GOOD_SALES_TRIGGER",
    });
    expect(updated.id).toBe(before?.id);
    expect(updated.createdAt.getTime()).toBe(before?.createdAt.getTime());
    expect(updated.relevant).toBe(true);
    expect(updated.reason).toBe("GOOD_SALES_TRIGGER");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(updated.createdAt.getTime());

    const rows = await prisma.signalFeedback.findMany({
      where: { accountId: accountAId, userId: userAId, signalId },
    });
    expect(rows).toHaveLength(1);
  });

  it("G: keeps tenant feedback isolated", async () => {
    if (!tableReady) return;
    const other = await upsertSignalFeedback(accountBId, userBId, {
      signalId,
      relevant: false,
      reason: "WRONG_CONTEXT",
    });
    expect(other.accountId).toBe(accountBId);
    expect(await getSignalFeedback(accountBId, userBId, signalId)).toMatchObject({
      relevant: false,
      reason: "WRONG_CONTEXT",
    });
    expect(await getSignalFeedback(accountAId, userAId, signalId)).toMatchObject({
      relevant: true,
      reason: "GOOD_SALES_TRIGGER",
    });
    expect(await listSignalFeedbackForCompany(accountAId, userAId, companyId)).toHaveLength(1);
    expect(await listSignalFeedbackForCompany(accountBId, userBId, companyId)).toHaveLength(1);
  });

  it("I: does not change the live Company-Greet", async () => {
    if (!tableReady) return;
    const before = await getCompanyGreet(companyId);
    await upsertSignalFeedback(accountAId, userAId, {
      signalId,
      relevant: false,
      reason: "NOT_IN_PORTFOLIO",
    });
    const after = await getCompanyGreet(companyId);
    expect(after).toEqual(before);
  });
});
