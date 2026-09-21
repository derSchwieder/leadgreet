import { prisma } from "./client";
import { getCurrentUser } from "./current-user";

/** Transitional demo tenant until real account context exists. Not authentication. */
export const DEMO_ACCOUNT_SLUG = "demo";
export const DEMO_ACCOUNT_NAME = "Demo Account";

/**
 * Resolves the Demo Account (slug: "demo"), creating it if needed.
 * Explicit demo/seed helper — not the request identity resolver.
 * Product pages and APIs must call getCurrentAccountId() instead.
 */
export async function getDemoAccountId(): Promise<string> {
  const existing = await prisma.account.findUnique({
    where: { slug: DEMO_ACCOUNT_SLUG },
  });
  if (existing) {
    return existing.id;
  }

  const created = await prisma.account.create({
    data: {
      name: DEMO_ACCOUNT_NAME,
      slug: DEMO_ACCOUNT_SLUG,
    },
  });
  return created.id;
}

/**
 * Server-side tenant identity for the current request.
 *
 * Prisma `Account` is the sales tenant (Mandant), not an Auth.js provider-account row.
 * Never read the tenant from URL, query, body, or client state.
 *
 * Resolution: current user → user.accountId → Account.
 * If no user identity is available yet, fall back to the demo account.
 */
export async function getCurrentAccountId(): Promise<string> {
  const user = await getCurrentUser();
  if (user.accountId) {
    return user.accountId;
  }
  return getDemoAccountId();
}
