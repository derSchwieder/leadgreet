import { hostnameFromUrl } from "@/lib/research/brave/classify";
import type { ScreeningWebResearchResult } from "@/types";
import {
  acceptContactCandidate,
  canonicalPersonName,
  dedupeContactCandidates,
  isPlausiblePersonName,
  mentionsCompany,
  validateContactCandidate,
  privateContactDataFields,
} from "./quality";
import { scoreContactRelevance } from "./relevance";
import { isAllowedContactResult, isLinkedInProfile } from "./sources";
import type { ContactTheme } from "./themes";
import type { ContactResearchCandidate } from "./types";

const NAME = String.raw`(?:Dr\.\s+)?[A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,2}`;
const EVP_ROLE = String.raw`Executive Vice President(?:\s+and\s+Head of [A-Za-zÄÖÜäöüß0-9& /.-]{3,55})?|EVP(?:\s+[A-Za-zÄÖÜäöüß0-9& /.-]{3,40})?`;
const C_LEVEL =
  String.raw`Chief\s+(?:Digital|Information|Technology|Data)\s+Officer(?:\s*\(\s*(?:CIO|CTO|CDO)\s*\))?|Head of [A-Za-zÄÖÜäöüß& /-]{3,40}|Leiter(?:in)?(?:\s+der)?\s+[A-Za-zÄÖÜäöüß& /-]{3,40}|CIO|CTO|CDO|CITO|Director of [A-Za-z ]{3,40}`;
const ROLE = `(?:${C_LEVEL}|${EVP_ROLE})`;

const NAME_ROLE_SEPARATOR = String.raw`[,:|–—-]`;
const NAME_THEN_ROLE = new RegExp(`\\b(${NAME})\\s*${NAME_ROLE_SEPARATOR}\\s*(${ROLE})`, "g");
const ROLE_THEN_NAME = new RegExp(`\\b(${ROLE})\\s+(${NAME})\\b`, "g");
const NAME_AT_COMPANY = new RegExp(
  `\\b(${NAME})\\s+(?:is|ist)\\s+(?:the\\s+)?(${ROLE})\\s+(?:at|bei|for)\\s+`,
  "gi",
);
const ROLE_COMPOUND_AFTER_ROLE = String.raw`(?:\s*[/|–—-]\s*[A-Za-zÄÖÜäöüß0-9& /.-]{2,60})?`;
const NAME_THEN_ROLE_AT_COMPANY = new RegExp(
  `\\b(${NAME})\\s*${NAME_ROLE_SEPARATOR}\\s*(${ROLE})${ROLE_COMPOUND_AFTER_ROLE}\\s+(?:at|bei)\\s+`,
  "gi",
);
const NAME_THEN_ROLE_FOR_COMPANY = new RegExp(
  `\\b(${NAME})\\s*${NAME_ROLE_SEPARATOR}\\s*(${ROLE})${ROLE_COMPOUND_AFTER_ROLE}\\s+for\\s+`,
  "gi",
);
const NAME_IS_OFFICER_PAREN_FOR = new RegExp(
  String.raw`\b(${NAME})\s+(?:is|ist)\s+the\s+Chief\s+(?:Information|Technology|Digital)\s+Officer\s*\(\s*(CIO|CTO|CDO)\s*\)\s+for\s+`,
  "gi",
);
const NAME_HAS_BEEN_APPOINTED = new RegExp(
  `\\b(${NAME})\\s+has been appointed\\s+(?:as\\s+)?(${EVP_ROLE}|${C_LEVEL})`,
  "gi",
);
const APPOINTS_NAME_AS = new RegExp(
  `\\bappoints\\s+(${NAME})\\s+as\\s+(?:an\\s+)?(${ROLE})`,
  "gi",
);
const NAME_AS_C_LEVEL = new RegExp(`\\b(${NAME})\\s+as\\s+(CIO|CTO|CDO)\\b`, "gi");
const NAME_INCOMING_OFFICER = new RegExp(
  String.raw`\b(${NAME}),\s+the incoming chief (information|technology|digital) officer at\s+`,
  "gi",
);

const EXTRACT_PATTERNS: RegExp[] = [
  NAME_THEN_ROLE,
  NAME_THEN_ROLE_AT_COMPANY,
  NAME_THEN_ROLE_FOR_COMPANY,
  NAME_AT_COMPANY,
  NAME_IS_OFFICER_PAREN_FOR,
  NAME_HAS_BEEN_APPOINTED,
  APPOINTS_NAME_AS,
  NAME_AS_C_LEVEL,
];

export const EXTRACTION_PATTERN_ROLE_THEN_NAME = "ROLE_THEN_NAME";
export const EXTRACTION_PATTERN_L2A_SIEMENS_LEADERSHIP = "L2A_SIEMENS_LEADERSHIP";
export const EXTRACTION_PATTERN_L2_SIEMENS_PRESS_APPOSITION = "L2_SIEMENS_PRESS_APPOSITION";

export type ExtractedPerson = {
  name: string;
  role: string;
  pattern?: string;
};

export type ExtractPeopleScope = {
  company: string;
  sourceUrl?: string;
};

const L2A_SENIOR_ROLE = "President and Managing Director";
const L2A_ROLE_LEAD = /^President and Managing Director\b/i;
const L2A_SERVES_AS = new RegExp(
  String.raw`\b(${NAME})\s+serves as\s+(President and Managing Director)\b`,
  "i",
);
/** Siemens press succession prose: `Name, … as well as ${C_LEVEL}` (scoped via ExtractPeopleScope). */
const L2_SIEMENS_PRESS_APPOSITION = new RegExp(
  String.raw`\b(${NAME})\s*,\s*(?:[^\n]{0,220}?)\s+as well as\s+(${C_LEVEL})\b`,
  "gi",
);
const TITLE_ONLY_NAME = new RegExp(String.raw`^${NAME}$`);
const TITLE_NAME_BEFORE_PIPE = new RegExp(String.raw`^(${NAME})\s*\|`);

const ROLE_THEN_NAME_ROLE_PARTICLE = /^(of|and|the|&|der|und|in|for|to)$/i;

const ROLE_THEN_NAME_ORG_NAME_PART =
  /^(Siemens|Energy|Gamesa|Industries|AG|Read|Partners|Software|Mobility)$/i;

/** Deterministic person/role extraction from research text (no quality gates). */
export function extractPeopleFromText(text: string, scope?: ExtractPeopleScope): ExtractedPerson[] {
  return matchPeople(text, scope);
}

export function extractContactCandidates(input: {
  company: string;
  results: readonly ScreeningWebResearchResult[];
  themes: readonly ContactTheme[];
}): ContactResearchCandidate[] {
  const extracted: ContactResearchCandidate[] = [];
  for (const result of input.results) {
    if (!isAllowedContactResult(result)) continue;
    const text = `${result.title}\n${result.description ?? ""}`;
    for (const match of matchPeople(text, {
      company: input.company,
      sourceUrl: result.url,
    })) {
      const scored = scoreContactRelevance(roleHintForRelevance(match.role), input.themes);
      if (!scored) {
        if (isLinkedInProfile(result.url)) {
          console.info("[contact-candidate-decision]", {
            company: input.company,
            name: match.name,
            role: match.role,
            sourceUrl: result.url,
            extractionPattern: match.pattern ?? null,
            decision: "rejected",
            stage: "relevance",
            reason: "No matching contact theme",
          });
        }
        continue;
      }
      const candidate: ContactResearchCandidate = {
        name: match.name,
        role: collapseWhitespace(match.role),
        company: input.company,
        profileUrl: isLinkedInProfile(result.url) ? result.url : undefined,
        sourceUrl: result.url,
        sourceTitle: result.title,
        sourcePublisher: result.source ?? undefined,
        ...(match.pattern ? { extractionPattern: match.pattern } : {}),
        evidence: [
          {
            url: result.url,
            title: result.title,
            publisher: result.source ?? undefined,
            publishedAt: result.publishedAt ?? undefined,
          },
        ],
        relevance: scored.relevance,
        relevanceReason: scored.relevanceReason,
        relatedSignals: scored.relatedSignals,
      };
      const validationReason = validateContactCandidate(candidate, input.results, input.company);
      const accepted = acceptContactCandidate(candidate, input.results, input.company);
      if (isLinkedInProfile(result.url)) {
        console.info("[contact-candidate-decision]", {
          company: input.company,
          name: match.name,
          role: match.role,
          sourceUrl: result.url,
          extractionPattern: match.pattern ?? null,
          decision: accepted ? "accepted" : "rejected",
          stage: accepted ? "accepted" : "quality",
          reason: accepted ? null : validationReason ?? "Rejected by a later acceptance check (source/profile URL gate)",
          privacyMatchFields: !accepted && validationReason === "Candidate includes private contact data."
            ? privateContactDataFields(candidate, input.results.find((item) => item.url === result.url))
            : [],
        });
      }
      if (accepted) extracted.push(accepted);
    }
  }
  return dedupeContactCandidates(extracted, input.results);
}

function matchPeople(text: string, scope?: ExtractPeopleScope): ExtractedPerson[] {
  const found: ExtractedPerson[] = [];
  const seen = new Set<string>();
  for (const regex of EXTRACT_PATTERNS) {
    regex.lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      if (regex === NAME_THEN_ROLE && shouldRejectColonNameThenRoleMatch(text, match)) {
        continue;
      }
      pushPerson(found, seen, match[1], match[2]);
    }
  }
  NAME_INCOMING_OFFICER.lastIndex = 0;
  for (const match of text.matchAll(NAME_INCOMING_OFFICER)) {
    const role =
      match[2] === "technology" ? "CTO" : match[2] === "digital" ? "CDO" : "CIO";
    pushPerson(found, seen, match[1], role);
  }
  if (scope) {
    pushL2aSiemensLeadershipTitleNameRoleLead(text, scope, found, seen);
    pushL2SiemensPressApposition(text, scope, found, seen);
  }
  ROLE_THEN_NAME.lastIndex = 0;
  for (const match of text.matchAll(ROLE_THEN_NAME)) {
    const rawRole = match[1] ?? "";
    const rawName = match[2] ?? "";
    const normalizedRole = normalizeRoleThenNameCapture(rawRole);
    if (!normalizedRole) continue;
    const matchEnd = (match.index ?? 0) + match[0].length;
    if (!roleThenNameHasEmploymentContext(text, matchEnd)) continue;
    if (isOrganizationLikePersonName(canonicalPersonName(collapseWhitespace(rawName)))) continue;
    pushPerson(found, seen, rawName, normalizedRole, EXTRACTION_PATTERN_ROLE_THEN_NAME);
  }
  return found;
}

function pushPerson(
  found: ExtractedPerson[],
  seen: Set<string>,
  name?: string,
  role?: string,
  pattern?: string,
) {
  const cleanName = canonicalPersonName(collapseWhitespace(name ?? ""));
  const cleanRole = trimRoleSuffixForCompany(normalizeExtractedRole(role ?? ""));
  if (!cleanName || !cleanRole || !isPlausiblePersonName(cleanName)) return;
  if (isRejectedExtractedName(cleanName)) return;
  const key = `${cleanName.toLocaleLowerCase("de")}|${cleanRole.toLocaleLowerCase("de")}`;
  if (seen.has(key)) return;
  seen.add(key);
  const entry: ExtractedPerson = { name: cleanName, role: cleanRole };
  if (pattern) entry.pattern = pattern;
  found.push(entry);
}

function normalizeRoleThenNameCapture(rawRole: string): string | null {
  const role = collapseWhitespace(rawRole);
  if (!role || !isRoleCaptureSaneForRoleThenName(role)) return null;
  const canonicalPatterns: RegExp[] = [
    /^Executive Vice President(?:\s+and\s+Head of [A-Za-zÄÖÜäöüß0-9& /.-]{3,55})?$/i,
    /^EVP(?:\s+[A-Za-zÄÖÜäöüß0-9& /.-]{3,40})?$/i,
    /^Chief\s+(?:Digital|Information|Technology|Data)\s+Officer(?:\s*\(\s*(?:CIO|CTO|CDO)\s*\))?$/i,
    /^Head of [A-Za-zÄÖÜäöüß& /-]{3,40}$/,
    /^Leiter(?:in)?(?:\s+der)?\s+[A-Za-zÄÖÜäöüß& /-]{3,40}$/i,
    /^Director of [A-ZÄÖÜ][a-zäöüß]+(?: [A-ZÄÖÜ][a-zäöüß]+)?$/,
    /^(?:CIO|CTO|CDO|CITO)$/,
  ];
  if (canonicalPatterns.some((pattern) => pattern.test(role))) return role;
  return null;
}

function isRoleCaptureSaneForRoleThenName(role: string): boolean {
  if (/\sat\s/i.test(role)) return false;
  for (const word of role.split(/\s+/)) {
    if (/^[a-zäöüß]+$/.test(word) && !ROLE_THEN_NAME_ROLE_PARTICLE.test(word)) {
      return false;
    }
  }
  return true;
}

function roleThenNameHasEmploymentContext(text: string, matchEnd: number): boolean {
  const window = text.slice(matchEnd, matchEnd + 120);
  return /\b(at|bei|for)\s+[A-ZÄÖÜ]/.test(window);
}

function isOrganizationLikePersonName(name: string): boolean {
  const trimmed = name.trim();
  if (/^(Siemens\s+Energy|Siemens\s+Gamesa)$/i.test(trimmed)) return true;
  const parts = trimmed.split(/\s+/);
  return parts.some((part) => ROLE_THEN_NAME_ORG_NAME_PART.test(part));
}

function nameThenRoleMatchUsesColonSeparator(match: RegExpMatchArray): boolean {
  const name = match[1] ?? "";
  const full = match[0] ?? "";
  if (!name || !full.includes(name)) return false;
  const afterName = full.slice(full.indexOf(name) + name.length);
  return /^\s*:/.test(afterName);
}

/** G1: reject `Label: ROLE Person` misreads on colon-only NAME_THEN_ROLE matches. */
function shouldRejectColonNameThenRoleMatch(text: string, match: RegExpMatchArray): boolean {
  if (!nameThenRoleMatchUsesColonSeparator(match)) return false;
  const rawName = match[1] ?? "";
  const cleanName = canonicalPersonName(collapseWhitespace(rawName));
  if (isOrganizationLikePersonName(cleanName)) return true;
  const matchEnd = (match.index ?? 0) + match[0].length;
  return personFollowsAfterNameThenRoleMatch(text, matchEnd);
}

function personFollowsAfterNameThenRoleMatch(text: string, afterIndex: number): boolean {
  const tail = text.slice(afterIndex);
  const roleThenPerson = new RegExp(String.raw`^\s+(?:${ROLE})\s+(${NAME})\b`);
  const rolePersonMatch = tail.match(roleThenPerson);
  if (rolePersonMatch?.[1]) {
    const name = canonicalPersonName(rolePersonMatch[1]);
    if (isPlausiblePersonName(name) && !isRejectedExtractedName(name)) return true;
  }
  const personOnly = new RegExp(String.raw`^\s+(${NAME})\b`);
  const personMatch = tail.match(personOnly);
  if (personMatch?.[1]) {
    const name = canonicalPersonName(personMatch[1]);
    if (isPlausiblePersonName(name) && !isRejectedExtractedName(name)) return true;
  }
  return false;
}

function normalizeExtractedRole(role: string): string {
  return collapseWhitespace(role);
}

function trimRoleSuffixForCompany(role: string): string {
  return role.replace(/\s+for\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß&.-]{2,40}$/i, "").trim();
}

function isSiemensL2aScope(scope: ExtractPeopleScope, text: string): boolean {
  const company = scope.company.trim();
  if (!/\bsiemens\b/i.test(company)) return false;
  if (!mentionsCompany(text, company)) return false;
  if (scope.sourceUrl) {
    const host = hostnameFromUrl(scope.sourceUrl);
    if (!host || !/(^|\.)siemens\.com$/i.test(host)) return false;
  }
  return true;
}

function stripMarkdownHeading(title: string): string {
  return title.replace(/^#+\s*/, "").trim();
}

function firstNonEmptyLine(block: string): string {
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function resolveL2aPersonNameFromTitle(title: string): string | null {
  const stripped = stripMarkdownHeading(title);
  if (TITLE_ONLY_NAME.test(stripped)) {
    const name = canonicalPersonName(stripped);
    if (isPlausiblePersonName(name) && !isRejectedExtractedName(name)) return name;
  }
  const pipe = stripped.match(TITLE_NAME_BEFORE_PIPE);
  if (pipe?.[1]) {
    const name = canonicalPersonName(pipe[1]);
    if (isPlausiblePersonName(name) && !isRejectedExtractedName(name)) return name;
  }
  return null;
}

function pushL2SiemensPressApposition(
  text: string,
  scope: ExtractPeopleScope,
  found: ExtractedPerson[],
  seen: Set<string>,
) {
  if (!isSiemensL2aScope(scope, text)) return;
  L2_SIEMENS_PRESS_APPOSITION.lastIndex = 0;
  for (const match of text.matchAll(L2_SIEMENS_PRESS_APPOSITION)) {
    const normalizedRole = normalizeRoleThenNameCapture(collapseWhitespace(match[2] ?? ""));
    if (!normalizedRole) continue;
    pushPerson(
      found,
      seen,
      match[1],
      normalizedRole,
      EXTRACTION_PATTERN_L2_SIEMENS_PRESS_APPOSITION,
    );
  }
}

function pushL2aSiemensLeadershipTitleNameRoleLead(
  text: string,
  scope: ExtractPeopleScope,
  found: ExtractedPerson[],
  seen: Set<string>,
) {
  if (!isSiemensL2aScope(scope, text)) return;

  const newline = text.indexOf("\n");
  const title = newline >= 0 ? text.slice(0, newline) : text;
  const description = newline >= 0 ? text.slice(newline + 1) : "";
  const personName = resolveL2aPersonNameFromTitle(title);
  if (!personName) return;

  const roleLeadLine = firstNonEmptyLine(description);
  if (roleLeadLine && L2A_ROLE_LEAD.test(roleLeadLine)) {
    pushPerson(found, seen, personName, L2A_SENIOR_ROLE, EXTRACTION_PATTERN_L2A_SIEMENS_LEADERSHIP);
    return;
  }

  const serves = text.match(L2A_SERVES_AS);
  if (serves?.[1] && serves[2]) {
    const name = canonicalPersonName(serves[1]);
    if (name !== personName) return;
    if (!/\bfor\s+Siemens\b/i.test(text)) return;
    pushPerson(found, seen, name, L2A_SENIOR_ROLE, EXTRACTION_PATTERN_L2A_SIEMENS_LEADERSHIP);
  }
}

function roleHintForRelevance(role: string): string {
  if (/President|Managing Director/i.test(role)) {
    return `${role} digital executive leadership`;
  }
  if (/Chief Information Officer|\bCIO\b/i.test(role)) {
    return `${role} CIO`;
  }
  if (/Executive Vice President|\bEVP\b/i.test(role)) {
    return `${role} EVP data digital`;
  }
  if (/Head of Data/i.test(role)) {
    return `${role} data ai`;
  }
  if (/Chief Technology Officer|\bCTO\b/i.test(role)) {
    return `${role} CTO`;
  }
  if (/Chief Digital Officer|\bCDO\b/i.test(role)) {
    return `${role} digital`;
  }
  return role;
}

const REJECTED_NAME_LEAD = /^(Since|Artificial|United|Biography|Managing|Public|Global|Next|Leadership|Digital|Executive|Chief|October|January|February|March|April|May|June|July|August|September|November|December)$/i;

function isRejectedExtractedName(name: string): boolean {
  const parts = name.trim().split(/\s+/);
  if (parts.some((part) => REJECTED_NAME_LEAD.test(part))) return true;
  return false;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
