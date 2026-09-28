/**
 * L1.1 specification: guards for ROLE_THEN_NAME in matchPeople (extract.ts).
 * Documentation only — no runtime wiring. Implement in a follow-up task.
 *
 * @see scripts/data/siemens-extraction-audit-fixtures.ts
 * @see src/lib/screening/contacts/extract.ts
 */

export const SIEMENS_ROLE_THEN_NAME_GUARDS_VERSION = "2026-09-28-l1.1";

export type RoleThenNameGuardId =
  | "G-ROLE-CAPTURE-SANE"
  | "G-NAME-NOT-ORG"
  | "G-NAME-PLAUSIBLE-UNCHANGED"
  | "G-SKIP-IF-HIGHER-PATTERN"
  | "G-KEEP-CTO-NAME-EMPLOYMENT-PROSE";

export type GuardVerdict = "apply_at_role_then_name" | "apply_at_push_person" | "apply_at_regex";

export type RoleThenNameGuardSpec = {
  id: RoleThenNameGuardId;
  verdict: GuardVerdict;
  problem: string;
  rule: string;
  falsePositiveFixtures: readonly string[];
  regressionFixtures: readonly string[];
  risk: string;
  priority: "L1" | "L2";
};

/**
 * Current behavior (baseline documentation).
 */
export const ROLE_THEN_NAME_BASELINE = {
  exists: true,
  location: "src/lib/screening/contacts/extract.ts",
  definition: "\\b(ROLE)\\s+(NAME)\\b — ROLE = C_LEVEL | EVP_ROLE; NAME = 2–3 TitleCase tokens, optional Dr.",
  order:
    "Runs after EXTRACT_PATTERNS and NAME_INCOMING_OFFICER; swaps capture groups (role, name) → pushPerson(name, role).",
  roleDefinitionSummary:
    "C_LEVEL (Chief * Officer, Head of …, Leiter …, CIO|CTO|CDO|CITO, Director of …) plus EVP_ROLE.",
  existingGuardsOnAllMatches: [
    "canonicalPersonName + collapseWhitespace",
    "isPlausiblePersonName (2–4 TitleCase parts; rejects names containing officer/chief/head/…)",
    "isRejectedExtractedName (REJECTED_NAME_LEAD token in any name part)",
    "trimRoleSuffixForCompany on role (trailing ' for Company')",
    "dedupe by name|role key",
  ],
  existingNegativeTestsElsewhere: [
    "contacts.test.ts: impersonal appointment headlines (APPOINTS without name)",
    "contacts.test.ts: EVP line without name",
    "contacts.test.ts: digital transformation for Siemens (no person)",
    "contacts.test.ts: Schaeffler dash noise titles (NAME_THEN_ROLE, not ROLE_THEN_NAME)",
  ],
  auditFalsePositivesToPrevent: [
    "role-then-name-renewable-energy-board",
    "role-then-name-siemens-gamesa",
    "role-then-name-director-greedy",
    "role-then-name-head-of-data-generic",
    "role-then-name-partners-read-podcast (ROLE_THEN_NAME leg only; colon is separate)",
  ],
} as const;

export const ROLE_THEN_NAME_GUARD_SPECS: readonly RoleThenNameGuardSpec[] = [
  {
    id: "G-ROLE-CAPTURE-SANE",
    verdict: "apply_at_role_then_name",
    problem:
      "Director of [A-Za-z ]{3,40} is greedy: e.g. 'Director of Digitalization Jane Roe at' is stored as role, 'Siemens Energy' as name.",
    rule:
      "Reject ROLE_THEN_NAME match when captured role (group 1) contains: (a) a lowercase word other than allowed particles (of, and, the, &), OR (b) the substring ' at ', OR (c) more than one consecutive TitleCase token after the fixed role prefix. Preferred implementation: tighten Director-of tail in ROLE regex OR post-filter ROLE_THEN_NAME matches only.",
    falsePositiveFixtures: ["role-then-name-director-greedy"],
    regressionFixtures: [
      "role-then-name-dirk-thin-description",
      "regression-dirk-appoints",
      "regression-helmuth-cio-for",
    ],
    risk: "Low if scoped to Director of … matches; medium if applied to all C_LEVEL branches.",
    priority: "L1",
  },
  {
    id: "G-NAME-NOT-ORG",
    verdict: "apply_at_push_person",
    problem:
      "Organization/entity strings pass as person names when ROLE_THEN_NAME misfires (e.g. 'Siemens Energy').",
    rule:
      "After capture, reject name if: (1) any part matches /^(Siemens|Energy|Gamesa|Industries|AG|Read)$/i, OR (2) full name matches /^(Siemens\\s+Energy|Siemens\\s+Gamesa)$/i, OR (3) name equals screened company or known affiliate token list. Apply only to matches sourced from ROLE_THEN_NAME (tag match provenance in implementation).",
    falsePositiveFixtures: ["role-then-name-director-greedy"],
    regressionFixtures: [
      "role-then-name-dirk-thin-description",
      "regression-hanna-wsj",
      "regression-vasi-evp-appointed",
    ],
    risk: "Low for obvious org tokens; do not reject legitimate double surnames.",
    priority: "L1",
  },
  {
    id: "G-NAME-PLAUSIBLE-UNCHANGED",
    verdict: "apply_at_push_person",
    problem: "Guards must not weaken existing isPlausiblePersonName / isRejectedExtractedName.",
    rule: "No change to REJECTED_NAME_LEAD list as part of L1.1 unless a new false positive is proven; ROLE_THEN_NAME-specific filters are additive only.",
    falsePositiveFixtures: [],
    regressionFixtures: [
      "regression-helmuth-cio-for",
      "regression-hanna-wsj",
      "regression-vasi-evp-appointed",
      "regression-dirk-appoints",
    ],
    risk: "Regression if shared pushPerson logic is altered globally without provenance tagging.",
    priority: "L1",
  },
  {
    id: "G-SKIP-IF-HIGHER-PATTERN",
    verdict: "apply_at_role_then_name",
    problem:
      "Duplicate/conflicting extractions when primary patterns already found the same person (usually harmless after dedupe, but ROLE_THEN_NAME can add bogus second roles).",
    rule:
      "Optional optimization: skip ROLE_THEN_NAME when the same canonical name was already extracted from EXTRACT_PATTERNS or NAME_INCOMING_OFFICER in the same text. Does not replace G-ROLE-CAPTURE-SANE.",
    falsePositiveFixtures: [],
    regressionFixtures: ["role-then-name-dirk-thin-description"],
    risk: "Low; ensures Dirk still present from APPOINTS when description also matches ROLE_THEN_NAME.",
    priority: "L2",
  },
  {
    id: "G-KEEP-CTO-NAME-EMPLOYMENT-PROSE",
    verdict: "apply_at_role_then_name",
    problem:
      "Over-broad context guards (e.g. require 'appoints' or 'Siemens' within N chars) would drop legitimate 'Chief Technology Officer First Last at Siemens AG' description-only hits.",
    rule:
      "Any L1.1 filter that removes entity-board false positives (Renewable Energy … CTO …) must NOT remove matches where the same snippet also contains screened company (case-insensitive substring) within 160 characters of the match OR contains employment glue / at|bei|for after the name.",
    falsePositiveFixtures: [
      "role-then-name-renewable-energy-board",
      "role-then-name-siemens-gamesa",
    ],
    regressionFixtures: ["role-then-name-dirk-thin-description"],
    risk:
      "Medium: Gamesa snippet contains 'Siemens' substring — do not use company substring alone; combine with org-as-name or entity-affiliate list.",
    priority: "L1",
  },
];

/**
 * Explicit non-goals for L1.1 (documented to avoid scope creep).
 */
export const ROLE_THEN_NAME_L1_1_NON_GOALS = [
  "Extend ROLE with President / Managing Director / CEO (Del Costy — L2).",
  "Markdown ### heading rules (Peter Koorte management — L3/L2.3).",
  "NAME_THEN_ROLE colon guard for 'Partners Read: Chief Digital Officer' (separate ticket; see partners-read fixture).",
  "Employment, privacy, C0 LinkedIn posts, or orchestrator changes.",
  "New ROLE tokens (SVP, Member of the Managing Board, etc.).",
] as const;

/**
 * Suggested implementation order when coding starts.
 */
export const ROLE_THEN_NAME_L1_1_IMPLEMENTATION_ORDER = [
  "G-ROLE-CAPTURE-SANE",
  "G-NAME-NOT-ORG",
  "G-KEEP-CTO-NAME-EMPLOYMENT-PROSE (acceptance checks while tuning)",
  "G-SKIP-IF-HIGHER-PATTERN (optional)",
] as const;
