import { beforeEach, describe, expect, it, vi } from "vitest";

type OtpRow = {
  id: string;
  email: string;
  userId: string | null;
  codeHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  attempts: number;
  createdAt: Date;
};

const { prisma, otps, resetStore } = vi.hoisted(() => {
  const otps: OtpRow[] = [];
  const users: Array<{ id: string; email: string }> = [];
  let nextId = 1;

  const client = {
    user: {
      findFirst: async ({ where }: { where: { email: string } }) =>
        users.find((user) => user.email === where.email) ?? null,
    },
    authOtp: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { email: string; consumedAt: null };
        data: { consumedAt: Date };
      }) => {
        let count = 0;
        for (const row of otps) {
          if (row.email === where.email && row.consumedAt === null) {
            row.consumedAt = data.consumedAt;
            count += 1;
          }
        }
        return { count };
      },
      create: async ({
        data,
      }: {
        data: {
          email: string;
          userId: string | null;
          codeHash: string;
          expiresAt: Date;
          attempts: number;
        };
      }) => {
        const row: OtpRow = {
          id: `otp-${String(nextId).padStart(4, "0")}`,
          email: data.email,
          userId: data.userId,
          codeHash: data.codeHash,
          expiresAt: data.expiresAt,
          consumedAt: null,
          attempts: data.attempts,
          createdAt: new Date(Date.now() + nextId),
        };
        nextId += 1;
        otps.push(row);
        return { id: row.id, email: row.email, userId: row.userId, expiresAt: row.expiresAt };
      },
      findFirst: async ({
        where,
        orderBy,
      }: {
        where: { email: string };
        orderBy: Array<{ createdAt?: "desc"; id?: "desc" }> | { createdAt: "desc" };
      }) => {
        const matches = otps.filter((row) => row.email === where.email);
        matches.sort((a, b) => {
          const byCreated = b.createdAt.getTime() - a.createdAt.getTime();
          if (byCreated !== 0) return byCreated;
          return b.id.localeCompare(a.id);
        });
        void orderBy;
        const row = matches[0];
        return row
          ? {
              id: row.id,
              email: row.email,
              userId: row.userId,
              codeHash: row.codeHash,
              expiresAt: row.expiresAt,
              consumedAt: row.consumedAt,
              attempts: row.attempts,
            }
          : null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { attempts?: number; consumedAt?: Date };
      }) => {
        const row = otps.find((item) => item.id === where.id);
        if (!row) return null;
        if (data.attempts !== undefined) row.attempts = data.attempts;
        if (data.consumedAt !== undefined) row.consumedAt = data.consumedAt;
        return row;
      },
    },
  };

  const prisma = {
    ...client,
    $transaction: async (fn: (tx: typeof client) => Promise<unknown>) => fn(client),
  };

  function resetStore() {
    otps.length = 0;
    users.length = 0;
    nextId = 1;
    users.push({ id: "user-a", email: "a@leadgreet.test" });
  }

  return { prisma, otps, users, resetStore };
});

vi.mock("@/lib/db/client", () => ({ prisma }));

import { createOtp, invalidatePendingOtps, MAX_OTP_ATTEMPTS, verifyOtp } from "./index";

describe("OTP service", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates an 8-digit OTP and stores only a hash", async () => {
    const created = await createOtp({ email: "A@leadgreet.test" });
    expect(created.code).toMatch(/^\d{8}$/);
    expect(created.email).toBe("a@leadgreet.test");
    expect(created.userId).toBe("user-a");

    expect(otps).toHaveLength(1);
    expect(otps[0]?.codeHash).not.toBe(created.code);
    expect(otps[0]?.codeHash).not.toContain(created.code);
    expect(JSON.stringify(otps[0])).not.toContain(created.code);
    expect(otps[0]?.consumedAt).toBeNull();
    expect(otps[0]?.attempts).toBe(0);
  });

  it("accepts the correct code once and sets consumedAt", async () => {
    const created = await createOtp({ email: "a@leadgreet.test" });
    const accepted = await verifyOtp({ email: "a@leadgreet.test", code: created.code });
    expect(accepted).toEqual({ ok: true, email: "a@leadgreet.test", userId: "user-a" });
    expect(otps[0]?.consumedAt).toBeInstanceOf(Date);

    const reused = await verifyOtp({ email: "a@leadgreet.test", code: created.code });
    expect(reused).toEqual({ ok: false, reason: "consumed" });
  });

  it("rejects an incorrect code", async () => {
    const created = await createOtp({ email: "a@leadgreet.test" });
    const wrong = created.code === "00000000" ? "11111111" : "00000000";
    const result = await verifyOtp({ email: "a@leadgreet.test", code: wrong });
    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(JSON.stringify(result)).not.toContain(created.code);
    expect(otps[0]?.attempts).toBe(1);
    expect(otps[0]?.consumedAt).toBeNull();
  });

  it("rejects an expired code", async () => {
    const created = await createOtp({ email: "a@leadgreet.test" });
    const result = await verifyOtp({
      email: "a@leadgreet.test",
      code: created.code,
      now: new Date(created.expiresAt.getTime() + 1000),
    });
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("locks the OTP after 5 failed attempts", async () => {
    const created = await createOtp({ email: "a@leadgreet.test" });
    const wrong = created.code === "00000000" ? "11111111" : "00000000";

    for (let i = 0; i < MAX_OTP_ATTEMPTS - 1; i += 1) {
      expect(await verifyOtp({ email: "a@leadgreet.test", code: wrong })).toEqual({
        ok: false,
        reason: "invalid",
      });
    }

    expect(await verifyOtp({ email: "a@leadgreet.test", code: wrong })).toEqual({
      ok: false,
      reason: "locked",
    });
    expect(otps[0]?.attempts).toBe(MAX_OTP_ATTEMPTS);
    expect(otps[0]?.consumedAt).toBeInstanceOf(Date);
    expect((await verifyOtp({ email: "a@leadgreet.test", code: created.code })).ok).toBe(false);
  });

  it("invalidates a previous pending OTP when a new one is created", async () => {
    const first = await createOtp({ email: "a@leadgreet.test" });
    const second = await createOtp({ email: "a@leadgreet.test" });
    expect(second.id).not.toBe(first.id);
    expect(otps.find((row) => row.id === first.id)?.consumedAt).toBeInstanceOf(Date);
    expect(otps.find((row) => row.id === second.id)?.consumedAt).toBeNull();

    expect((await verifyOtp({ email: "a@leadgreet.test", code: first.code })).ok).toBe(false);
    expect(await verifyOtp({ email: "a@leadgreet.test", code: second.code })).toMatchObject({
      ok: true,
    });
  });

  it("keeps OTPs isolated per email", async () => {
    const forA = await createOtp({ email: "a@leadgreet.test" });
    const forB = await createOtp({ email: "b@leadgreet.test" });

    expect(await verifyOtp({ email: "b@leadgreet.test", code: forA.code })).toMatchObject({
      ok: false,
    });
    expect(await verifyOtp({ email: "b@leadgreet.test", code: forB.code })).toEqual({
      ok: true,
      email: "b@leadgreet.test",
      userId: null,
    });
    expect(await verifyOtp({ email: "a@leadgreet.test", code: forA.code })).toMatchObject({
      ok: true,
    });
  });

  it("can invalidate pending OTPs without verifying", async () => {
    const created = await createOtp({ email: "a@leadgreet.test" });
    expect(await invalidatePendingOtps("a@leadgreet.test")).toBe(1);
    expect(await verifyOtp({ email: "a@leadgreet.test", code: created.code })).toEqual({
      ok: false,
      reason: "consumed",
    });
  });
});
