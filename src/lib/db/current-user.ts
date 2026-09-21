import { getCurrentSession } from "@/lib/session";
import { ensureDemoUser, type DemoUser } from "./users";

/**
 * Server-side current identity.
 *
 * Resolution: session cookie → Session → User → User.accountId.
 * If no valid session exists, fall back to the demo user on the demo tenant.
 *
 * Never read identity from URL, query, body, or client state.
 * Prisma Account is the sales tenant (Mandant), not an Auth.js OAuth Account.
 */
export type CurrentUser = DemoUser;

export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const session = await getCurrentSession();
    if (session?.user.accountId) {
      return session.user;
    }
  } catch {
    // Missing session table, cookie context, or lookup errors: demo fallback.
  }

  const { getDemoAccountId } = await import("./accounts");
  const accountId = await getDemoAccountId();
  return ensureDemoUser(accountId);
}
