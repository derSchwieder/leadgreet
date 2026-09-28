export type NormalizedScreeningInput = {
  name: string;
  domain: string | null;
};

const SCREEN_SUFFIX = /\s+screenen\.?$/i;

export function normalizeScreeningName(value: string): string {
  return value.replace(SCREEN_SUFFIX, "").trim();
}

export function normalizeScreeningDomain(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

export function normalizeScreeningInput(input: {
  name: string;
  domain?: string | null;
}): NormalizedScreeningInput {
  return {
    name: normalizeScreeningName(input.name),
    domain: normalizeScreeningDomain(input.domain),
  };
}

export function websitesMatch(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizeScreeningDomain(left);
  const b = normalizeScreeningDomain(right);
  return Boolean(a && b && a === b);
}

export function namesMatch(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase("de") === right.trim().toLocaleLowerCase("de");
}
