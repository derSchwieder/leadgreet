export class RateLimitError extends Error {
  constructor(message = "Bitte später erneut versuchen.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;
export const OTP_REQUESTS_PER_EMAIL = 5;
export const OTP_REQUESTS_PER_IP = 20;
export const OTP_VERIFIES_PER_EMAIL = 10;
export const OTP_VERIFIES_PER_IP = 30;

const buckets = new Map<string, number[]>();

export function resetAuthRateLimits(): void {
  buckets.clear();
}

export function consumeRateLimit(
  key: string,
  max: number,
  windowMs = AUTH_RATE_WINDOW_MS,
  now = Date.now(),
): boolean {
  const cutoff = now - windowMs;
  const recent = (buckets.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export function consumeAuthRateLimit(key: string, max: number, now = Date.now()): void {
  if (!consumeRateLimit(key, max, AUTH_RATE_WINDOW_MS, now)) {
    throw new RateLimitError();
  }
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
