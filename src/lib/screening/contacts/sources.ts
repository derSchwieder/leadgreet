import { hostnameFromUrl } from "@/lib/research/brave/classify";
import type { ScreeningWebResearchResult } from "@/types";

const BLOCKED_HOSTS = new Set([
  "zoominfo.com",
  "rocketreach.co",
  "apollo.io",
  "hunter.io",
  "lusha.com",
  "clearbit.com",
  "beenverified.com",
  "spokeo.com",
  "whitepages.com",
  "peoplefinder.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "threads.net",
  "twitter.com",
  "x.com",
]);

export function isBlockedContactSource(url: string): boolean {
  const host = hostnameFromUrl(url);
  if (!host) return true;
  for (const blocked of BLOCKED_HOSTS) {
    if (host === blocked || host.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function isLinkedInProfile(url: string): boolean {
  const host = hostnameFromUrl(url);
  if (!host) return false;
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return false;
  return /\/in\//i.test(url) && !/\/jobs\//i.test(url);
}

export function isAllowedContactResult(result: ScreeningWebResearchResult): boolean {
  if (isBlockedContactSource(result.url)) return false;
  const host = hostnameFromUrl(result.url);
  if (host && (host === "linkedin.com" || host.endsWith(".linkedin.com"))) {
    return isLinkedInProfile(result.url);
  }
  return true;
}

export function sourcePriority(result: ScreeningWebResearchResult): number {
  if (result.sourceKind === "official") return 4;
  if (result.sourceKind === "news") return 3;
  if (isLinkedInProfile(result.url)) return 2;
  return 1;
}
