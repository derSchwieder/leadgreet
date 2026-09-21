import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashSessionToken, SESSION_TTL_MS } from "./tokens";

type SessionRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

type UserRow = {
  id: string;
  accountId: string;
  name: string;
  email: string;
};

const { prisma, sessions, users, resetStore } = vi.hoisted(() => {
  const sessions: SessionRow[] = [];
  const users: UserRow[] = [];
  let nextId = 1;

  const client = {
    user: {
      findUnique: async ({
        where,
      }: {
        where: { id: string };
      }) => users.find((user) => user.id === where.id) ?? null,
    },
    session: {
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          tokenHash: string;
          expiresAt: Date;
          lastUsedAt: Date;
        };
      }) => {
        const row: SessionRow = {
          id: `sess-${String(nextId).padStart(4, "0")}`,
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
          lastUsedAt: data.lastUsedAt,
          revokedAt: null,
        };
        nextId += 1;
        sessions.push(row);
        return {
          id: row.id,
          userId: row.userId,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
          lastUsedAt: row.lastUsedAt,
          revokedAt: row.revokedAt,
        };
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const row = sessions.find((item) => item.tokenHash === where.tokenHash);
        if (!row) return null;
        const user = users.find((item) => item.id === row.userId) ?? null;
        return { ...row, user };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { lastUsedAt?: Date; revokedAt?: Date };
      }) => {
        const row = sessions.find((item) => item.id === where.id);
        if (!row) return null;
        if (data.lastUsedAt !== undefined) row.lastUsedAt = data.lastUsedAt;
        if (data.revokedAt !== undefined) row.revokedAt = data.revokedAt;
        return row;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id?: string; userId?: string; revokedAt: null };
        data: { revokedAt: Date };
      }) => {
        let count = 0;
        for (const row of sessions) {
          if (where.id && row.id !== where.id) continue;
          if (where.userId && row.userId !== where.userId) continue;
          if (row.revokedAt !== null) continue;
          row.revokedAt = data.revokedAt;
          count += 1;
        }
        return { count };
      },
    },
  };

  function resetStore() {
    sessions.length = 0;
    users.length = 0;
    nextId = 1;
    users.push(
      {
        id: "user-a",
        accountId: "account-a",
        name: "User A",
        email: "a@leadgreet.test",
      },
      {
        id: "user-b",
        accountId: "account-b",
        name: "User B",
        email: "b@leadgreet.test",
      },
    );
  }

  return { prisma: client, sessions, users, resetStore };
});

vi.mock("@/lib/db/client", () => ({ prisma }));

import { createSession, getSessionByToken, revokeAllUserSessions, revokeSession } from "./store";

describe("session store", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates a session for a user and persists only the token hash", async () => {
    const created = await createSession("user-a");
    expect(created.userId).toBe("user-a");
    expect(created.user).toEqual(users[0]);
    expect(created.token.length).toBeGreaterThanOrEqual(43);
    expect(created.revokedAt).toBeNull();
    expect(created.expiresAt.getTime()).toBe(created.lastUsedAt!.getTime() + SESSION_TTL_MS);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.tokenHash).toBe(hashSessionToken(created.token));
    expect(sessions[0]?.tokenHash).not.toBe(created.token);
    expect(sessions[0]?.tokenHash).not.toContain(created.token);
    expect(JSON.stringify(sessions[0])).not.toContain(created.token);
    expect("token" in sessions[0]!).toBe(false);
  });

  it("recognizes a valid session for the owning user and account", async () => {
    const created = await createSession("user-a");
    const resolved = await getSessionByToken(created.token);
    expect(resolved?.id).toBe(created.id);
    expect(resolved?.userId).toBe("user-a");
    expect(resolved?.user.accountId).toBe("account-a");
    expect(resolved).not.toHaveProperty("token");
    expect(resolved).not.toHaveProperty("tokenHash");
    expect(sessions[0]?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("rejects an unknown token", async () => {
    await createSession("user-a");
    await expect(getSessionByToken("not-a-real-session-token")).resolves.toBeNull();
    await expect(getSessionByToken("")).resolves.toBeNull();
  });

  it("rejects an expired session", async () => {
    const created = await createSession("user-a");
    await expect(
      getSessionByToken(created.token, new Date(created.expiresAt.getTime() + 1000)),
    ).resolves.toBeNull();
  });

  it("rejects a revoked session", async () => {
    const created = await createSession("user-a");
    expect(await revokeSession(created.id)).toBe(true);
    expect(sessions[0]?.revokedAt).toBeInstanceOf(Date);
    await expect(getSessionByToken(created.token)).resolves.toBeNull();
  });

  it("cannot be used as another user or to inject another account", async () => {
    const created = await createSession("user-a");
    const resolved = await getSessionByToken(created.token);
    expect(resolved?.user.id).toBe("user-a");
    expect(resolved?.user.id).not.toBe("user-b");
    expect(resolved?.user.accountId).toBe("account-a");
    expect(resolved?.user.accountId).not.toBe("account-b");
  });

  it("revokes all sessions for one user without touching another", async () => {
    const first = await createSession("user-a");
    const second = await createSession("user-a");
    const other = await createSession("user-b");

    expect(await revokeAllUserSessions("user-a")).toBe(2);
    await expect(getSessionByToken(first.token)).resolves.toBeNull();
    await expect(getSessionByToken(second.token)).resolves.toBeNull();
    await expect(getSessionByToken(other.token)).resolves.toMatchObject({
      userId: "user-b",
      user: { accountId: "account-b" },
    });
  });

  it("throws when the user does not exist", async () => {
    await expect(createSession("missing-user")).rejects.toThrow("user not found");
  });
});
