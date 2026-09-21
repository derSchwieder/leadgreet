import { readSessionTokenFromRequest } from "./cookie";
import { getSessionByToken, type ResolvedSession } from "./store";

/**
 * Resolves the current request session from the HttpOnly cookie, if present.
 * Cookie read is separated from DB validation. Returns null outside a request
 * or when the cookie/session is missing or invalid.
 */
export async function getCurrentSession(now = new Date()): Promise<ResolvedSession | null> {
  try {
    const token = await readSessionTokenFromRequest();
    if (!token) return null;
    return await getSessionByToken(token, now);
  } catch {
    return null;
  }
}
