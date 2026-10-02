import { normalizeEvidenceUrl } from "@/lib/analysis/evidence";
import type { ScreeningWebResearchResult } from "@/types";
import type { ContactResearchCandidate } from "./types";
import { isAllowedContactResult, isLinkedInProfile, sourcePriority } from "./sources";

const EMAIL = /\b\S+@\S+\.\S+\b/;
const PHONE = /\b(?:\+?\d[\d\s/()-]{7,}\d)\b/;

export function normalizePersonName(name: string): string {
  return canonicalPersonName(name).toLocaleLowerCase("de");
}

export function canonicalPersonName(name: string): string {
  const parts = name.replace(/\s+/g, " ").trim().split(/\s+/);
  if (parts.length <= 2) return parts.join(" ");
  return parts.slice(-2).join(" ");
}

const IMPERSONAL_NAME = /officer|digital|chief|head|director|leiter|manager|partnership|summit/i;

export function isPlausiblePersonName(name: string): boolean {
  const trimmed = name.replace(/\s+/g, " ").trim();
  if (!trimmed || IMPERSONAL_NAME.test(trimmed)) return false;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2 || parts.length > 4) return false;
  return parts.every((part) => /^[A-ZÄÖÜ][a-zäöüß'-]+$/.test(part) || part === "Dr.");
}

export function contactEvidenceUrls(candidate: ContactResearchCandidate): string[] {
  const urls = [
    candidate.sourceUrl,
    candidate.profileUrl,
    ...candidate.evidence.map((item) => item.url),
  ].filter((url): url is string => Boolean(url));
  return urls;
}

export function hasPrivateContactData(value: string): boolean {
  return EMAIL.test(value) || PHONE.test(value);
}

/** Returns field names only; never logs the matched email address or phone number. */
export function privateContactDataFields(
  candidate: Partial<ContactResearchCandidate>,
  source?: Pick<ScreeningWebResearchResult, "title" | "description"> | null,
): string[] {
  const fields: Array<[string, string | undefined]> = [
    ["candidate.name", candidate.name],
    ["candidate.role", candidate.role],
    ["candidate.company", candidate.company],
    ["candidate.sourceTitle", candidate.sourceTitle],
    ["candidate.sourcePublisher", candidate.sourcePublisher],
    ["candidate.relevanceReason", candidate.relevanceReason],
    ["source.title", source?.title],
    ["source.description", source?.description],
  ];
  for (const [index, signal] of (candidate.relatedSignals ?? []).entries()) {
    fields.push([`candidate.relatedSignals[${index}]`, signal]);
  }
  for (const [index, item] of (candidate.evidence ?? []).entries()) {
    fields.push([`candidate.evidence[${index}].title`, item.title], [`candidate.evidence[${index}].publisher`, item.publisher]);
  }
  return fields
    .filter(([, value]) => typeof value === "string" && hasPrivateContactData(value))
    .map(([field]) => field);
}

export function extractPrivacyScanText(
  candidate: Partial<ContactResearchCandidate>,
  source?: Pick<ScreeningWebResearchResult, "title" | "description"> | null,
): string {
  const parts = [
    candidate.name,
    candidate.role,
    candidate.company,
    candidate.sourceTitle,
    candidate.sourcePublisher,
    candidate.relevanceReason,
    ...(candidate.relatedSignals ?? []),
    ...(candidate.evidence ?? []).flatMap((item) => [item.title, item.publisher]),
    source?.title,
    source?.description,
  ];
  return parts
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n");
}

export function mentionsCompany(text: string, company: string): boolean {
  const haystack = text.toLocaleLowerCase("de");
  const needle = company.trim().toLocaleLowerCase("de");
  if (!needle) return false;
  return haystack.includes(needle);
}

/** Second C-suite officer in press-style compounds (e.g. CTO and Chief Strategy Officer of Siemens AG). */
const ROLE_AND_SECOND_CHIEF_OFFICER = String.raw`(?:\s+and\s+Chief\s+(?:Digital|Information|Technology|Data|Strategy)\s+Officer)?`;

/** Optional compound title segment between role and at/bei/of (e.g. "/ IT & Digitalization"). */
const ROLE_COMPOUND_BEFORE_EMPLOYER = String.raw`(?:\s*[/|–—-]\s*(?:[A-Za-zÄÖÜäöüß0-9&][A-Za-zÄÖÜäöüß0-9& /.-]{0,78})?)?${ROLE_AND_SECOND_CHIEF_OFFICER}`;

/** Employer name after at/bei/of/for (e.g. `Siemens`, `Siemens AG`, or distinct `Siemens Energy`). */
const EMPLOYER_AFTER_GLUE = String.raw`([A-ZÄÖÜ][A-Za-zÄÖÜäöüß&.-]+(?:\s+(?:AG|Energy|Healthineers)\b)?)`;

export function extractRoleEmployer(text: string, role: string): string | null {
  for (const rolePattern of employmentRolePatternStrings(role)) {
    const match = text.match(
      new RegExp(
        `${rolePattern}${ROLE_COMPOUND_BEFORE_EMPLOYER}\\s+(?:at|bei|of|for)\\s+${EMPLOYER_AFTER_GLUE}`,
        "i",
      ),
    );
    if (match?.[1]) return collapseEmployerCapture(match[1]);
  }
  return null;
}

function collapseEmployerCapture(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:!?]+$/, "");
}

export function employerMatchesCompany(employer: string, company: string): boolean {
  const left = employer.trim().toLocaleLowerCase("de");
  const right = company.trim().toLocaleLowerCase("de");
  if (!left || !right) return false;
  if (left === right) return true;
  if (left === `${right} ag` || right === `${left} ag`) return true;
  if (left.startsWith(`${right} `)) {
    return left.slice(right.length + 1) === "ag";
  }
  if (right.startsWith(`${left} `)) {
    return right.slice(left.length + 1) === "ag";
  }
  return false;
}

export function hasEmploymentAtScreenedCompany(
  text: string,
  company: string,
  role: string,
  personName?: string,
): boolean {
  const employer = extractRoleEmployer(text, role);
  if (employer) {
    return employerMatchesCompany(employer, company);
  }
  if (personName && hasAppointmentEmployment(text, company, personName, role)) {
    return true;
  }
  const companyEsc = escapeRegExp(company.trim());
  for (const rolePattern of employmentRolePatternStrings(role)) {
    if (
      new RegExp(
        `${rolePattern}${ROLE_COMPOUND_BEFORE_EMPLOYER}\\s+(?:at|bei)\\s+${companyEsc}\\b`,
        "i",
      ).test(text)
    ) {
      return true;
    }
    if (
      new RegExp(
        `${rolePattern}${ROLE_COMPOUND_BEFORE_EMPLOYER}\\s+for\\s+${companyEsc}\\b`,
        "i",
      ).test(text)
    ) {
      return true;
    }
  }
  return false;
}

export function looksEmployedByOtherCompany(
  text: string,
  _name: string,
  company: string,
  role: string,
): boolean {
  const employer = extractRoleEmployer(text, role);
  if (!employer) return false;
  return !employerMatchesCompany(employer, company);
}

export function validateContactCandidate(
  candidate: Partial<ContactResearchCandidate>,
  results: readonly ScreeningWebResearchResult[],
  company: string,
): string | null {
  if (!candidate.name?.trim()) return "Candidate is missing a name.";
  if (!isPlausiblePersonName(candidate.name)) return "Candidate name is not plausible.";
  if (!candidate.role?.trim()) return "Candidate is missing a role.";
  if (!candidate.company?.trim()) return "Candidate is missing a company.";
  if (!candidate.sourceUrl?.trim() && !(candidate.evidence && candidate.evidence.length > 0)) {
    return "Candidate is missing evidence.";
  }

  const allowed = new Set(results.map((result) => normalizeEvidenceUrl(result.url)));
  const urls = [
    candidate.sourceUrl,
    candidate.profileUrl,
    ...(candidate.evidence ?? []).map((item) => item.url),
  ].filter((url): url is string => Boolean(url));
  if (urls.length === 0) return "Candidate is missing evidence.";
  for (const url of urls) {
    if (!allowed.has(normalizeEvidenceUrl(url))) {
      return "Candidate evidence URL was not present in the research results.";
    }
  }

  const source = results.find(
    (result) => normalizeEvidenceUrl(result.url) === normalizeEvidenceUrl(urls[0]!),
  );
  if (hasPrivateContactData(extractPrivacyScanText(candidate, source))) {
    return "Candidate includes private contact data.";
  }
  const snippet = `${source?.title ?? ""} ${source?.description ?? ""}`;
  if (!hasEmploymentAtScreenedCompany(snippet, company, candidate.role, candidate.name)) {
    return "Candidate source does not show employment at the screened company.";
  }
  if (looksEmployedByOtherCompany(snippet, candidate.name, company, candidate.role)) {
    return "Candidate appears employed by a partner or other company.";
  }
  return null;
}

export function acceptContactCandidate(
  candidate: ContactResearchCandidate,
  results: readonly ScreeningWebResearchResult[],
  company: string,
): ContactResearchCandidate | null {
  if (validateContactCandidate(candidate, results, company)) return null;
  const source = results.find(
    (result) => normalizeEvidenceUrl(result.url) === normalizeEvidenceUrl(candidate.sourceUrl),
  );
  if (source && !isAllowedContactResult(source)) return null;
  if (candidate.profileUrl && !sourceHasUrl(results, candidate.profileUrl)) return null;
  if (candidate.profileUrl && isBlockedProfile(candidate.profileUrl)) return null;
  return {
    ...candidate,
    name: canonicalPersonName(candidate.name),
    role: candidate.role.trim(),
    company: candidate.company.trim(),
    relatedSignals: uniqueStrings(candidate.relatedSignals),
  };
}

export function dedupeContactCandidates(
  candidates: readonly ContactResearchCandidate[],
  results: readonly ScreeningWebResearchResult[],
): ContactResearchCandidate[] {
  const byName = new Map<string, ContactResearchCandidate>();
  for (const candidate of candidates) {
    const key = normalizePersonName(candidate.name);
    const current = byName.get(key);
    if (!current) {
      byName.set(key, candidate);
      continue;
    }
    byName.set(key, preferCandidate(current, candidate, results));
  }
  return [...byName.values()];
}

function preferCandidate(
  left: ContactResearchCandidate,
  right: ContactResearchCandidate,
  results: readonly ScreeningWebResearchResult[],
): ContactResearchCandidate {
  const leftSource = results.find(
    (result) => normalizeEvidenceUrl(result.url) === normalizeEvidenceUrl(left.sourceUrl),
  );
  const rightSource = results.find(
    (result) => normalizeEvidenceUrl(result.url) === normalizeEvidenceUrl(right.sourceUrl),
  );
  const leftScore = (leftSource ? sourcePriority(leftSource) : 0) + left.evidence.length;
  const rightScore = (rightSource ? sourcePriority(rightSource) : 0) + right.evidence.length;
  const winner = rightScore > leftScore ? right : left;
  const other = winner === right ? left : right;
  return {
    ...winner,
    evidence: uniqueEvidence([...winner.evidence, ...other.evidence]),
    relatedSignals: uniqueStrings([...winner.relatedSignals, ...other.relatedSignals]),
    profileUrl: winner.profileUrl ?? other.profileUrl,
  };
}

function sourceHasUrl(results: readonly ScreeningWebResearchResult[], url: string): boolean {
  const normalized = normalizeEvidenceUrl(url);
  return results.some((result) => normalizeEvidenceUrl(result.url) === normalized);
}

function isBlockedProfile(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (host.includes("linkedin.com")) return !isLinkedInProfile(url);
    return /facebook|instagram|tiktok|threads|twitter|x\.com/.test(host);
  } catch {
    return true;
  }
}

function uniqueEvidence(evidence: ContactResearchCandidate["evidence"]) {
  const seen = new Set<string>();
  return evidence.filter((item) => {
    const key = normalizeEvidenceUrl(item.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.trim();
    if (!key) continue;
    const normalized = key.toLocaleLowerCase("de");
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(key);
  }
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function employmentRolePatternStrings(role: string): string[] {
  const trimmed = role.trim();
  const patterns = new Set<string>([escapeRegExp(trimmed)]);
  if (/^CIO$/i.test(trimmed) || /chief information officer/i.test(trimmed)) {
    patterns.add(String.raw`Chief Information Officer(?:\s*\(\s*CIO\s*\))?`);
    patterns.add(String.raw`\(\s*CIO\s*\)`);
    patterns.add(String.raw`\bCIO\b`);
  }
  if (/^CTO$/i.test(trimmed) || /chief technology officer/i.test(trimmed)) {
    patterns.add(String.raw`Chief Technology Officer(?:\s*\(\s*CTO\s*\))?`);
    patterns.add(String.raw`\bCTO\b`);
  }
  if (/^CDO$/i.test(trimmed) || /chief digital officer/i.test(trimmed)) {
    patterns.add(String.raw`Chief Digital Officer(?:\s*\(\s*CDO\s*\))?`);
    patterns.add(String.raw`\bCDO\b`);
  }
  if (/^EVP\b/i.test(trimmed) || /executive vice president/i.test(trimmed)) {
    patterns.add(String.raw`Executive Vice President(?:\s+and\s+Head of [A-Za-zÄÖÜäöüß0-9& /.-]{3,55})?`);
    patterns.add(String.raw`\bEVP(?:\s+[A-Za-zÄÖÜäöüß0-9& /.-]{3,40})?`);
  }
  return [...patterns];
}

function hasAppointmentEmployment(
  text: string,
  company: string,
  personName: string,
  role: string,
): boolean {
  if (!mentionsCompany(text, company)) return false;
  const nameEsc = escapeRegExp(canonicalPersonName(personName));
  const companyEsc = escapeRegExp(company.trim());
  for (const rolePattern of employmentRolePatternStrings(role)) {
    const companyAppoints = new RegExp(
      `\\b${companyEsc}[A-Za-zÄÖÜäöüß&.-]{0,40}\\b[^.\\n]{0,80}?\\bappoints\\s+${nameEsc}\\s+as\\s+(?:an\\s+)?${rolePattern}\\b`,
      "i",
    );
    if (companyAppoints.test(text)) return true;

    const appointedAt = new RegExp(
      `\\b${nameEsc}\\b[^.\\n]{0,120}?\\bhas been appointed\\s+(?:as\\s+)?${rolePattern}(?:[^.\\n]{0,100}?\\s+(?:at|bei)\\s+${companyEsc}[A-Za-zÄÖÜäöüß&.-]{0,20})?\\b`,
      "i",
    );
    if (appointedAt.test(text)) return true;

    const joinsAndAppointed =
      new RegExp(`\\b${nameEsc}\\b[^.\\n]{0,160}?\\bjoins\\s+${companyEsc}[A-Za-zÄÖÜäöüß&.-]{0,20}\\b`, "i").test(
        text,
      ) &&
      new RegExp(
        `\\b${nameEsc}\\b[^.\\n]{0,160}?\\bhas been appointed\\s+(?:as\\s+)?${rolePattern}\\b`,
        "i",
      ).test(text);
    if (joinsAndAppointed) return true;
  }
  return false;
}
