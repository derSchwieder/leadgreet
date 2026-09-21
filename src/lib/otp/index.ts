import { prisma } from "@/lib/db/client";
import {
  generateOtpCode,
  hashOtpCode,
  isOtpCodeFormat,
  MAX_OTP_ATTEMPTS,
  normalizeOtpEmail,
  OTP_TTL_MS,
  otpHashMatches,
} from "./codes";

export { MAX_OTP_ATTEMPTS, OTP_LENGTH, OTP_TTL_MS } from "./codes";

export function isMissingAuthOtpTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "P2021") return true;
  return (
    typeof candidate.message === "string" &&
    /AuthOtp|relation .*authotp/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

export type CreateOtpResult = {
  id: string;
  email: string;
  userId: string | null;
  expiresAt: Date;
  /** Plaintext for delivery (tests / later email). Never persisted. */
  code: string;
};

export type VerifyOtpResult =
  | { ok: true; email: string; userId: string | null }
  | { ok: false; reason: "invalid" | "expired" | "consumed" | "locked" };

async function findUserIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function invalidatePendingOtps(email: string, now = new Date()): Promise<number> {
  const normalized = normalizeOtpEmail(email);
  if (!normalized) return 0;

  const result = await prisma.authOtp.updateMany({
    where: {
      email: normalized,
      consumedAt: null,
    },
    data: { consumedAt: now },
  });
  return result.count;
}

export async function createOtp(input: { email: string; now?: Date }): Promise<CreateOtpResult> {
  const email = normalizeOtpEmail(input.email);
  if (!email) {
    throw new Error("email is required");
  }

  const now = input.now ?? new Date();
  const code = generateOtpCode();
  const userId = await findUserIdByEmail(email);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  const row = await prisma.$transaction(async (tx) => {
    await tx.authOtp.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: now },
    });
    return tx.authOtp.create({
      data: {
        email,
        userId,
        codeHash: hashOtpCode(code),
        expiresAt,
        attempts: 0,
      },
      select: { id: true, email: true, userId: true, expiresAt: true },
    });
  });

  return {
    id: row.id,
    email: row.email,
    userId: row.userId,
    expiresAt: row.expiresAt,
    code,
  };
}

export async function verifyOtp(input: {
  email: string;
  code: string;
  now?: Date;
}): Promise<VerifyOtpResult> {
  const email = normalizeOtpEmail(input.email);
  const code = input.code.trim();
  const now = input.now ?? new Date();

  if (!email || !isOtpCodeFormat(code)) {
    return { ok: false, reason: "invalid" };
  }

  const row = await prisma.authOtp.findFirst({
    where: { email },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      email: true,
      userId: true,
      codeHash: true,
      expiresAt: true,
      consumedAt: true,
      attempts: true,
    },
  });

  if (!row) {
    return { ok: false, reason: "invalid" };
  }

  if (row.consumedAt) {
    return { ok: false, reason: "consumed" };
  }

  if (row.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }

  if (row.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, reason: "locked" };
  }

  if (!otpHashMatches(code, row.codeHash)) {
    const attempts = row.attempts + 1;
    const locked = attempts >= MAX_OTP_ATTEMPTS;
    await prisma.authOtp.update({
      where: { id: row.id },
      data: {
        attempts,
        ...(locked ? { consumedAt: now } : {}),
      },
    });
    return { ok: false, reason: locked ? "locked" : "invalid" };
  }

  await prisma.authOtp.update({
    where: { id: row.id },
    data: { consumedAt: now },
  });

  return { ok: true, email: row.email, userId: row.userId };
}
