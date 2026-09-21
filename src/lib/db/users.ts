import type { PrismaClient, User } from "@prisma/client";
import { prisma } from "./client";

/** Clearly synthetic identity for the demo tenant. Not a login. */
export const DEMO_USER_NAME = "Demo User";
export const DEMO_USER_EMAIL = "demo@leadgreet.local";

export type DemoUser = Pick<User, "id" | "accountId" | "name" | "email">;

/**
 * Ensures exactly one demo user for the given sales tenant.
 * Idempotent: repeated calls reuse the same email and do not create a second row.
 * Does not attach the user to activities or status history.
 */
export async function ensureDemoUser(
  accountId: string,
  client: Pick<PrismaClient, "user"> = prisma,
): Promise<DemoUser> {
  const existing = await client.user.findFirst({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true, accountId: true, name: true, email: true },
  });

  if (existing) {
    if (existing.accountId === accountId && existing.name === DEMO_USER_NAME) {
      return existing;
    }
    return client.user.update({
      where: { id: existing.id },
      data: { accountId, name: DEMO_USER_NAME },
      select: { id: true, accountId: true, name: true, email: true },
    });
  }

  return client.user.create({
    data: {
      accountId,
      name: DEMO_USER_NAME,
      email: DEMO_USER_EMAIL,
    },
    select: { id: true, accountId: true, name: true, email: true },
  });
}
