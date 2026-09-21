import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOGIN_OTP_INVALID_MESSAGE, LOGIN_OTP_REQUESTED_MESSAGE } from "./login";
import { RateLimitError } from "./rate-limit";
import { SESSION_TTL_MS } from "@/lib/session/tokens";

const { findFirst, createOtp, verifyOtp, generateOtpCode, createSession, getCurrentSession, revokeSession } =
  vi.hoisted(() => ({
    findFirst: vi.fn(),
    createOtp: vi.fn(),
    verifyOtp: vi.fn(),
    generateOtpCode: vi.fn(() => "00000000"),
    createSession: vi.fn(),
    getCurrentSession: vi.fn(),
    revokeSession: vi.fn(),
  }));

vi.mock("@/lib/db/client", () => ({
  prisma: {
    user: { findFirst },
  },
}));

vi.mock("@/lib/otp", () => ({
  createOtp,
  verifyOtp,
}));

vi.mock("@/lib/otp/codes", async () => {
  const actual = await vi.importActual<typeof import("@/lib/otp/codes")>("@/lib/otp/codes");
  return {
    ...actual,
    generateOtpCode,
  };
});

vi.mock("@/lib/session", () => ({
  createSession,
  getCurrentSession,
  revokeSession,
}));

import { completeLogin, logoutCurrentSession, requestLoginOtp } from "./login";

const user = {
  id: "user-a",
  accountId: "account-a",
  name: "Ada Lovelace",
  email: "ada@leadgreet.test",
};

function uniqueEmail(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}@leadgreet.test`;
}

describe("requestLoginOtp", () => {
  beforeEach(() => {
    findFirst.mockReset();
    createOtp.mockReset();
    verifyOtp.mockReset();
    generateOtpCode.mockReset();
    generateOtpCode.mockReturnValue("00000000");
    createSession.mockReset();
    getCurrentSession.mockReset();
    revokeSession.mockReset();
  });

  it("creates an OTP for a known email and exposes it only outside production", async () => {
    const email = uniqueEmail("known");
    findFirst.mockResolvedValue({ ...user, email });
    createOtp.mockResolvedValue({
      id: "otp-1",
      email,
      userId: user.id,
      expiresAt: new Date(),
      code: "12345678",
    });

    const requested = await requestLoginOtp({ email: email.toUpperCase(), nodeEnv: "test" });
    expect(findFirst).toHaveBeenCalledWith({
      where: { email },
      select: { id: true, accountId: true, name: true, email: true },
    });
    expect(createOtp).toHaveBeenCalledWith({ email, now: expect.any(Date) });
    expect(requested.message).toBe(LOGIN_OTP_REQUESTED_MESSAGE);
    expect(requested.developmentOtp).toBe("12345678");

    const production = await requestLoginOtp({
      email,
      nodeEnv: "production",
      ip: `prod-${crypto.randomUUID()}`,
    });
    expect(production).toEqual({ message: LOGIN_OTP_REQUESTED_MESSAGE });
    expect(production).not.toHaveProperty("developmentOtp");
    expect(JSON.stringify(production)).not.toContain("12345678");
  });

  it("does not reveal whether an unknown email has an account", async () => {
    const knownEmail = uniqueEmail("exists");
    const unknownEmail = uniqueEmail("missing");
    findFirst.mockImplementation(async ({ where }: { where: { email: string } }) =>
      where.email === knownEmail ? { ...user, email: knownEmail } : null,
    );
    createOtp.mockResolvedValue({
      id: "otp-1",
      email: knownEmail,
      userId: user.id,
      expiresAt: new Date(),
      code: "12345678",
    });

    const known = await requestLoginOtp({ email: knownEmail, nodeEnv: "production" });
    const unknown = await requestLoginOtp({ email: unknownEmail, nodeEnv: "production" });

    expect(createOtp).toHaveBeenCalledTimes(1);
    expect(known).toEqual(unknown);
    expect(unknown).toEqual({ message: LOGIN_OTP_REQUESTED_MESSAGE });
  });

  it("keeps the same development response shape for unknown emails", async () => {
    findFirst.mockResolvedValue(null);
    const unknown = await requestLoginOtp({ email: uniqueEmail("shape"), nodeEnv: "development" });
    expect(createOtp).not.toHaveBeenCalled();
    expect(unknown.message).toBe(LOGIN_OTP_REQUESTED_MESSAGE);
    expect(unknown.developmentOtp).toBe("00000000");
    expect(generateOtpCode).toHaveBeenCalled();
  });
});

describe("completeLogin", () => {
  beforeEach(() => {
    findFirst.mockReset();
    createOtp.mockReset();
    verifyOtp.mockReset();
    createSession.mockReset();
    createSession.mockImplementation(async (userId: string, now: Date) => ({
      id: "sess-1",
      userId,
      token: "session-token-secret",
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      createdAt: now,
      lastUsedAt: now,
      revokedAt: null,
      user,
    }));
  });

  it("creates a session for the matching user and account after a valid OTP", async () => {
    const email = uniqueEmail("login");
    const now = new Date("2026-09-21T12:00:00.000Z");
    findFirst.mockResolvedValue({ ...user, email });
    verifyOtp.mockResolvedValue({ ok: true, email, userId: user.id });

    const result = await completeLogin({
      email: `  ${email.toUpperCase()}  `,
      otp: "12345678",
      now,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(verifyOtp).toHaveBeenCalledWith({ email, code: "12345678", now });
    expect(createSession).toHaveBeenCalledWith(user.id, now);
    expect(result.session.userId).toBe(user.id);
    expect(result.session.user.accountId).toBe("account-a");
    expect(result.session.user.accountId).not.toBe("account-injected");
  });

  it("rejects an unknown email without revealing a user", async () => {
    findFirst.mockResolvedValue(null);
    verifyOtp.mockResolvedValue({ ok: false, reason: "invalid" });

    const result = await completeLogin({ email: uniqueEmail("ghost"), otp: "12345678" });
    expect(result).toEqual({ ok: false, message: LOGIN_OTP_INVALID_MESSAGE });
    expect(createSession).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("invalid");
  });

  it.each([
    ["invalid", { ok: false, reason: "invalid" } as const],
    ["expired", { ok: false, reason: "expired" } as const],
    ["consumed", { ok: false, reason: "consumed" } as const],
    ["locked", { ok: false, reason: "locked" } as const],
  ])("rejects a %s OTP with a generic error", async (_label, verified) => {
    const email = uniqueEmail(_label);
    findFirst.mockResolvedValue({ ...user, email });
    verifyOtp.mockResolvedValue(verified);

    const result = await completeLogin({ email, otp: "00000000" });
    expect(result).toEqual({ ok: false, message: LOGIN_OTP_INVALID_MESSAGE });
    expect(createSession).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(verified.reason);
  });

  it("does not create a session for another user's OTP", async () => {
    const email = uniqueEmail("mismatch");
    findFirst.mockResolvedValue({ ...user, email });
    verifyOtp.mockResolvedValue({ ok: true, email, userId: "user-other" });

    const result = await completeLogin({ email, otp: "12345678" });
    expect(result).toEqual({ ok: false, message: LOGIN_OTP_INVALID_MESSAGE });
    expect(createSession).not.toHaveBeenCalled();
  });
});

describe("logoutCurrentSession", () => {
  beforeEach(() => {
    getCurrentSession.mockReset();
    revokeSession.mockReset();
  });

  it("revokes the current session when one exists", async () => {
    getCurrentSession.mockResolvedValue({ id: "sess-1", userId: user.id, user });
    revokeSession.mockResolvedValue(true);
    await expect(logoutCurrentSession()).resolves.toEqual({ revoked: true });
    expect(revokeSession).toHaveBeenCalledWith("sess-1", expect.any(Date));
  });

  it("is a no-op when no session is present", async () => {
    getCurrentSession.mockResolvedValue(null);
    await expect(logoutCurrentSession()).resolves.toEqual({ revoked: false });
    expect(revokeSession).not.toHaveBeenCalled();
  });
});

describe("login rate limit", () => {
  it("limits OTP requests for the same email", async () => {
    const email = uniqueEmail("ratelimit");
    findFirst.mockResolvedValue({ ...user, email });
    createOtp.mockResolvedValue({
      id: "otp-1",
      email,
      userId: user.id,
      expiresAt: new Date(),
      code: "12345678",
    });

    for (let i = 0; i < 5; i += 1) {
      await requestLoginOtp({ email, nodeEnv: "production", ip: `ip-${email}-${i}` });
    }

    await expect(requestLoginOtp({ email, nodeEnv: "production" })).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });
});
