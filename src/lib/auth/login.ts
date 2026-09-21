import { prisma } from "@/lib/db/client";
import { createOtp, verifyOtp } from "@/lib/otp";
import { generateOtpCode, normalizeOtpEmail } from "@/lib/otp/codes";
import {
  createSession,
  getCurrentSession,
  revokeSession,
  type CreateSessionResult,
} from "@/lib/session";
import {
  consumeAuthRateLimit,
  OTP_REQUESTS_PER_EMAIL,
  OTP_REQUESTS_PER_IP,
  OTP_VERIFIES_PER_EMAIL,
  OTP_VERIFIES_PER_IP,
} from "./rate-limit";

export const LOGIN_OTP_REQUESTED_MESSAGE =
  "Wenn für diese E-Mail-Adresse ein Konto existiert, wurde ein Einmal-Code angefordert.";

export const LOGIN_OTP_INVALID_MESSAGE = "Einmal-Code ungültig oder abgelaufen.";

export type LoginUser = {
  id: string;
  accountId: string;
  name: string;
  email: string;
};

export type RequestLoginOtpResult = {
  message: string;
  developmentOtp?: string;
};

export type CompleteLoginResult =
  | { ok: true; session: CreateSessionResult }
  | { ok: false; message: string };

export function shouldExposeDevelopmentOtp(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return nodeEnv !== "production";
}

async function findLoginUser(email: string): Promise<LoginUser | null> {
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, accountId: true, name: true, email: true },
  });
  if (!user?.accountId) return null;
  return user;
}

function withDevelopmentOtp(
  message: string,
  code: string,
  nodeEnv: string | undefined,
): RequestLoginOtpResult {
  if (!shouldExposeDevelopmentOtp(nodeEnv)) {
    return { message };
  }
  return { message, developmentOtp: code };
}

export async function requestLoginOtp(input: {
  email: string;
  ip?: string;
  now?: Date;
  nodeEnv?: string;
}): Promise<RequestLoginOtpResult> {
  const email = normalizeOtpEmail(input.email);
  const now = input.now ?? new Date();
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV;

  consumeAuthRateLimit(`otp-email:${email}`, OTP_REQUESTS_PER_EMAIL, now.getTime());
  if (input.ip) {
    consumeAuthRateLimit(`otp-ip:${input.ip}`, OTP_REQUESTS_PER_IP, now.getTime());
  }

  const user = await findLoginUser(email);
  if (!user) {
    return withDevelopmentOtp(LOGIN_OTP_REQUESTED_MESSAGE, generateOtpCode(), nodeEnv);
  }

  const otp = await createOtp({ email, now });
  return withDevelopmentOtp(LOGIN_OTP_REQUESTED_MESSAGE, otp.code, nodeEnv);
}

export async function completeLogin(input: {
  email: string;
  otp: string;
  ip?: string;
  now?: Date;
}): Promise<CompleteLoginResult> {
  const email = normalizeOtpEmail(input.email);
  const now = input.now ?? new Date();

  consumeAuthRateLimit(`verify-email:${email}`, OTP_VERIFIES_PER_EMAIL, now.getTime());
  if (input.ip) {
    consumeAuthRateLimit(`verify-ip:${input.ip}`, OTP_VERIFIES_PER_IP, now.getTime());
  }

  const user = await findLoginUser(email);
  const verified = await verifyOtp({ email, code: input.otp, now });

  if (!user || !verified.ok || (verified.userId && verified.userId !== user.id)) {
    return { ok: false, message: LOGIN_OTP_INVALID_MESSAGE };
  }

  try {
    const session = await createSession(user.id, now);
    return { ok: true, session };
  } catch {
    return { ok: false, message: LOGIN_OTP_INVALID_MESSAGE };
  }
}

export async function logoutCurrentSession(now = new Date()): Promise<{ revoked: boolean }> {
  const session = await getCurrentSession(now);
  if (!session) {
    return { revoked: false };
  }
  const revoked = await revokeSession(session.id, now);
  return { revoked };
}
