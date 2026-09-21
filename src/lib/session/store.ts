import { prisma } from "@/lib/db/client";
import { generateSessionToken, hashSessionToken, SESSION_TTL_MS, sessionTokenHashMatches } from "./tokens";

export function isMissingSessionTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code === "P2021") return true;
  return (
    typeof candidate.message === "string" &&
    /Session|relation .*session/i.test(candidate.message) &&
    /does not exist/i.test(candidate.message)
  );
}

export type SessionUser = {
  id: string;
  accountId: string;
  name: string;
  email: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export type CreateSessionResult = SessionRecord & {
  /** Plaintext for the cookie layer. Never persisted. */
  token: string;
  user: SessionUser;
};

export type ResolvedSession = SessionRecord & {
  user: SessionUser;
};

const sessionUserSelect = {
  id: true,
  accountId: true,
  name: true,
  email: true,
} as const;

const sessionSelect = {
  id: true,
  userId: true,
  tokenHash: true,
  expiresAt: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
  user: { select: sessionUserSelect },
} as const;

function toRecord(row: {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}): SessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
  };
}

export async function createSession(userId: string, now = new Date()): Promise<CreateSessionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: sessionUserSelect,
  });
  if (!user) {
    throw new Error("user not found");
  }

  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const row = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
      lastUsedAt: now,
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });

  return {
    ...toRecord(row),
    token,
    user,
  };
}

export async function getSessionByToken(
  token: string,
  now = new Date(),
): Promise<ResolvedSession | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const tokenHash = hashSessionToken(trimmed);
  const row = await prisma.session.findUnique({
    where: { tokenHash },
    select: sessionSelect,
  });

  if (!row) return null;
  if (!sessionTokenHashMatches(trimmed, row.tokenHash)) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt.getTime() <= now.getTime()) return null;
  if (!row.user?.id || !row.user.accountId) return null;

  const lastUsedAt = now;
  await prisma.session.update({
    where: { id: row.id },
    data: { lastUsedAt },
  });

  return {
    ...toRecord({ ...row, lastUsedAt }),
    user: row.user,
  };
}

export async function revokeSession(sessionId: string, now = new Date()): Promise<boolean> {
  const result = await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count > 0;
}

export async function revokeAllUserSessions(userId: string, now = new Date()): Promise<number> {
  const result = await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count;
}
