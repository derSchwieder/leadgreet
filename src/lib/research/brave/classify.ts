import type { WebResearchSourceKind } from "@/types";
import { normalizeScreeningDomain } from "@/lib/screening/normalize";

const NEWS_HOSTS = new Set([
  "handelsblatt.com",
  "wiwo.de",
  "manager-magazin.de",
  "faz.net",
  "sueddeutsche.de",
  "zeit.de",
  "spiegel.de",
  "reuters.com",
  "bloomberg.com",
  "heise.de",
  "golem.de",
  "tagesschau.de",
]);

const JOB_HOSTS = new Set([
  "stepstone.de",
  "indeed.com",
  "linkedin.com",
  "xing.com",
  "stellenanzeigen.de",
  "karriere.at",
  "jobs.meinestadt.de",
]);

export function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

export function classifyResearchSource(
  url: string,
  officialDomain?: string | null,
): WebResearchSourceKind {
  const host = hostnameFromUrl(url);
  if (!host) return "other";
  const path = safePath(url);
  const official = normalizeScreeningDomain(officialDomain);

  if (official && (host === official || host.endsWith(`.${official}`))) {
    if (isJobsPath(path)) return "jobs";
    if (isNewsPath(path)) return "news";
    return "official";
  }
  if (matchesHost(host, JOB_HOSTS) || isJobsPath(path)) return "jobs";
  if (matchesHost(host, NEWS_HOSTS) || isNewsPath(path)) return "news";
  return "other";
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return "";
  }
}

function matchesHost(host: string, allowed: Set<string>): boolean {
  for (const candidate of allowed) {
    if (host === candidate || host.endsWith(`.${candidate}`)) return true;
  }
  return false;
}

function isJobsPath(path: string): boolean {
  return /\/(jobs|karriere|career|careers|stellen|stellenangebote|recruiting)\b/.test(path);
}

function isNewsPath(path: string): boolean {
  return /\/(presse|press|news|newsroom|aktuelles)\b/.test(path);
}
