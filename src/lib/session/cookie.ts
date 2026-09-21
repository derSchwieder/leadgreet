export const SESSION_COOKIE_NAME = "leadgreet_session";
export const SESSION_COOKIE_PATH = "/";
export const SESSION_COOKIE_SAMESITE = "lax" as const;

export type SessionCookieAttributes = {
  httpOnly: true;
  secure: boolean;
  sameSite: typeof SESSION_COOKIE_SAMESITE;
  path: typeof SESSION_COOKIE_PATH;
  expires: Date;
  maxAge: number;
};

export function isSessionCookieSecure(nodeEnv = process.env.NODE_ENV): boolean {
  return nodeEnv === "production";
}

export function sessionCookieAttributes(
  expiresAt: Date,
  now = new Date(),
  nodeEnv = process.env.NODE_ENV,
): SessionCookieAttributes {
  return {
    httpOnly: true,
    secure: isSessionCookieSecure(nodeEnv),
    sameSite: SESSION_COOKIE_SAMESITE,
    path: SESSION_COOKIE_PATH,
    expires: expiresAt,
    maxAge: Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function readSessionTokenFromRequest(): Promise<string | null> {
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const value = jar.get(SESSION_COOKIE_NAME)?.value?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, sessionCookieAttributes(expiresAt));
}

export async function clearSessionCookie(): Promise<void> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", clearedSessionCookieAttributes());
}

export function clearedSessionCookieAttributes(
  nodeEnv = process.env.NODE_ENV,
): SessionCookieAttributes {
  return {
    httpOnly: true,
    secure: isSessionCookieSecure(nodeEnv),
    sameSite: SESSION_COOKIE_SAMESITE,
    path: SESSION_COOKIE_PATH,
    expires: new Date(0),
    maxAge: 0,
  };
}

export function applySessionCookie(
  response: { cookies: { set: (name: string, value: string, options: SessionCookieAttributes) => unknown } },
  token: string,
  expiresAt: Date,
  now = new Date(),
  nodeEnv = process.env.NODE_ENV,
): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieAttributes(expiresAt, now, nodeEnv));
}

export function applyClearedSessionCookie(
  response: { cookies: { set: (name: string, value: string, options: SessionCookieAttributes) => unknown } },
  nodeEnv = process.env.NODE_ENV,
): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", clearedSessionCookieAttributes(nodeEnv));
}
