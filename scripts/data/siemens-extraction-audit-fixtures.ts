import type { ScreeningWebResearchResult } from "@/types";

/**
 * Reproducible Stage-A fixtures from the Siemens extraction audit (Sep 2026).
 * Source text is taken from public Siemens pages / press PDFs where noted.
 * Used for L1.1 ROLE_THEN_NAME guard work and future L2 (Del Costy) — not wired into tests yet.
 */
export type ExtractionAuditFixtureId =
  | "del-costy-us-management-list"
  | "del-costy-profile-serp"
  | "peter-koorte-pdf-heading"
  | "peter-koorte-management-heading"
  | "peter-koorte-press-prose"
  | "role-then-name-renewable-energy-board"
  | "role-then-name-siemens-gamesa"
  | "role-then-name-director-greedy"
  | "role-then-name-head-of-data-generic"
  | "role-then-name-partners-read-podcast"
  | "role-then-name-dirk-thin-description"
  | "regression-helmuth-cio-for"
  | "regression-dirk-appoints"
  | "regression-hanna-wsj"
  | "regression-vasi-evp-appointed";

export type ExtractionAuditCategory =
  | "l2_title_name_gap"
  | "l3_board_prose_gap"
  | "role_then_name_false_positive"
  | "role_then_name_legitimate"
  | "regression_must_extract";

export type ObservedStageA = {
  /** Result of extractPeopleFromText(\`\${title}\\n\${description}\`) as of audit baseline. */
  people: ReadonlyArray<{ name: string; role: string }>;
  /** Primary pattern family implicated in audit (informational). */
  mechanism?: string;
};

export type ExtractionAuditFixture = {
  id: ExtractionAuditFixtureId;
  category: ExtractionAuditCategory;
  auditNotes: string;
  provenance: {
    url: string;
    label: string;
    capturedOn: "2026-09-28";
  };
  title: string;
  description: string;
  observedStageA: ObservedStageA;
  /** Intended outcome after L1.1 (ROLE_THEN_NAME guards only). Undefined = no change expected. */
  targetAfterL1_1?: {
    people: ReadonlyArray<{ name: string; role: string }>;
  };
};

function asResearchResult(
  fixture: Pick<ExtractionAuditFixture, "title" | "description" | "provenance">,
): ScreeningWebResearchResult {
  return {
    title: fixture.title,
    description: fixture.description,
    url: fixture.provenance.url,
    source: new URL(fixture.provenance.url).hostname,
    sourceKind: "official",
  };
}

/** Map fixture → research result shape used by extractContactCandidates. */
export function researchResultFromExtractionFixture(
  fixture: ExtractionAuditFixture,
): ScreeningWebResearchResult {
  return asResearchResult(fixture);
}

export const SIEMENS_EXTRACTION_AUDIT_FIXTURES: readonly ExtractionAuditFixture[] = [
  {
    id: "del-costy-us-management-list",
    category: "l2_title_name_gap",
    auditNotes:
      "Official U.S. management list: heading is person name, role on following line. Stage A does not extract (President/MD not in ROLE; no Name–Separator–Role). L2 candidate, out of L1.1 scope.",
    provenance: {
      url: "https://www.siemens.com/en-us/company/leadership/us-management/",
      label: "Siemens U.S. management (live page structure)",
      capturedOn: "2026-09-28",
    },
    title: "### Del Costy",
    description:
      "President and Managing Director, Americas Siemens Digital Industries\n\n- Biography\n- Digital Industries Software",
    observedStageA: { people: [], mechanism: "none (L2 gap)" },
  },
  {
    id: "del-costy-profile-serp",
    category: "l2_title_name_gap",
    auditNotes:
      "Typical SERP shape for Del Costy profile: title is Name | long role string; description is prose. Still no Stage-A hit today.",
    provenance: {
      url: "https://www.siemens.com/en-us/company/leadership/us-management/del-costy/",
      label: "Del Costy profile + SERP-style title",
      capturedOn: "2026-09-28",
    },
    title:
      "Del Costy | President, Digital Industries U.S. RC and Managing Director, Americas Digital Industries Software",
    description:
      "Del Costy serves as President and Managing Director for Siemens Digital Industries in the Americas.",
    observedStageA: { people: [], mechanism: "none (L2 gap)" },
  },
  {
    id: "peter-koorte-pdf-heading",
    category: "l3_board_prose_gap",
    auditNotes:
      "Vorstands-PDF heading: name + Ph.D., then stacked titles without Name–Separator–Role. Baseline extractPeopleFromText returns [].",
    provenance: {
      url: "https://assets.new.siemens.com/siemens/assets/api/uuid:b3226557-a90e-41e9-aabe-4c6683ab5b27/BiographyPeterKoorteEN.pdf",
      label: "Peter Koorte biography PDF (heading block)",
      capturedOn: "2026-09-28",
    },
    title: "Peter Koorte, Ph.D.",
    description:
      "Member of the Managing Board of Siemens AG Chief Executive Officer Siemens Smart Infrastructure Chief Technology Officer and Chief Strategy Officer",
    observedStageA: { people: [], mechanism: "none (L3/L2.3)" },
  },
  {
    id: "peter-koorte-management-heading",
    category: "l3_board_prose_gap",
    auditNotes: "Management page markdown-style heading; role is generic board line, not IT C-level pattern.",
    provenance: {
      url: "https://www.siemens.com/en-us/company/leadership/management/",
      label: "Siemens global management list entry",
      capturedOn: "2026-09-28",
    },
    title: "### Peter Koorte",
    description: "Member of the Managing Board",
    observedStageA: { people: [], mechanism: "none (L3/L2.3)" },
  },
  {
    id: "peter-koorte-press-prose",
    category: "l3_board_prose_gap",
    auditNotes:
      "Press succession prose names Koorte in long sentences; no appointment regex anchor. Not a ROLE_THEN_NAME case.",
    provenance: {
      url: "https://press.siemens.com/global/en/pressrelease/supervisory-board-siemens-ag-announces-further-steps-orderly-succession-planning",
      label: "Siemens press release snippet (succession)",
      capturedOn: "2026-09-28",
    },
    title:
      "Supervisory Board of Siemens AG announces further steps in the orderly succession planning for the Managing Board",
    description:
      "Peter Koorte, member of the Managing Board as well as Chief Technology Officer and Chief Strategy Officer of Siemens AG, will assume responsibility on the Managing Board for Smart Infrastructure from Matthias Rebellius as of July 1, 2026.",
    observedStageA: { people: [], mechanism: "none (L3/L2.3)" },
  },
  {
    id: "role-then-name-renewable-energy-board",
    category: "role_then_name_false_positive",
    auditNotes:
      "Audit class: entity/board HTML where CTO is real role token but person is wrong context (Siemens Energy–style lists). ROLE_THEN_NAME fires on 'Chief Technology Officer John Smith'.",
    provenance: {
      url: "https://www.siemens-energy.com/",
      label: "Audit-derived snippet (Renewable Energy + CTO board list pattern)",
      capturedOn: "2026-09-28",
    },
    title: "Siemens Energy leadership",
    description: "Renewable Energy Chief Technology Officer John Smith leads the board",
    observedStageA: {
      people: [{ name: "John Smith", role: "Chief Technology Officer" }],
      mechanism: "ROLE_THEN_NAME",
    },
    targetAfterL1_1: { people: [] },
  },
  {
    id: "role-then-name-siemens-gamesa",
    category: "role_then_name_false_positive",
    auditNotes: "Same failure mode for affiliated entity pages (Gamesa) in contact SERP noise.",
    provenance: {
      url: "https://www.siemensgamesa.com/",
      label: "Audit-derived snippet (Gamesa + CTO)",
      capturedOn: "2026-09-28",
    },
    title: "Siemens Gamesa executive team",
    description: "Siemens Gamesa Chief Technology Officer Maria Garcia",
    observedStageA: {
      people: [{ name: "Maria Garcia", role: "Chief Technology Officer" }],
      mechanism: "ROLE_THEN_NAME",
    },
    targetAfterL1_1: { people: [] },
  },
  {
    id: "role-then-name-director-greedy",
    category: "role_then_name_false_positive",
    auditNotes:
      "Director-of subpattern is too greedy: role capture includes 'Jane Roe at', name becomes 'Siemens Energy'. High-priority L1.1 guard target.",
    provenance: {
      url: "https://www.siemens-energy.com/",
      label: "Audit-derived snippet (Director of … greediness)",
      capturedOn: "2026-09-28",
    },
    title: "Digital leadership",
    description: "Director of Digitalization Jane Roe at Siemens Energy",
    observedStageA: {
      people: [{ name: "Siemens Energy", role: "Director of Digitalization Jane Roe at" }],
      mechanism: "ROLE_THEN_NAME (Director of … tail)",
    },
    targetAfterL1_1: { people: [] },
  },
  {
    id: "role-then-name-head-of-data-generic",
    category: "role_then_name_false_positive",
    auditNotes:
      "Thin generic line: Head of Data + name without employer anchor. Audit: treat as false positive for contact pipeline; guard may be L2 if it kills rare true positives.",
    provenance: {
      url: "https://example.com/partners",
      label: "Audit-derived generic partner line",
      capturedOn: "2026-09-28",
    },
    title: "Industry partners",
    description: "Head of Data Anna Schmidt works with partners",
    observedStageA: {
      people: [{ name: "Anna Schmidt", role: "Head of Data" }],
      mechanism: "ROLE_THEN_NAME",
    },
    targetAfterL1_1: { people: [] },
  },
  {
    id: "role-then-name-partners-read-podcast",
    category: "role_then_name_false_positive",
    auditNotes:
      "Podcast/show title false positive: 'Partners Read: Chief Digital Officer Tom Jones'. ROLE_THEN_NAME extracts Tom Jones; NAME_THEN_ROLE (colon) also extracts 'Partners Read' as name — colon guard is out of L1.1 scope but fixture documents both.",
    provenance: {
      url: "https://example.com/partners-read-podcast",
      label: "Audit-derived podcast HTML/title pattern",
      capturedOn: "2026-09-28",
    },
    title: "Partners Read: Chief Digital Officer Tom Jones discusses trends",
    description: "Episode notes for digital leadership podcast series.",
    observedStageA: {
      people: [
        { name: "Partners Read", role: "Chief Digital Officer" },
        { name: "Tom Jones", role: "Chief Digital Officer" },
      ],
      mechanism: "NAME_THEN_ROLE (:) + ROLE_THEN_NAME",
    },
    targetAfterL1_1: {
      people: [],
    },
  },
  {
    id: "role-then-name-dirk-thin-description",
    category: "role_then_name_legitimate",
    auditNotes:
      "Regression guard: thin press description without 'appoints' must still yield Dirk via ROLE_THEN_NAME when higher-priority patterns absent in snippet.",
    provenance: {
      url: "https://press.siemens.com/cto",
      label: "Aligned with contacts.test.ts Dirk employment snippet",
      capturedOn: "2026-09-28",
    },
    title: "Siemens appoints Dirk Didascalou as Chief Technology Officer",
    description: "Dirk Didascalou serves as Chief Technology Officer at Siemens AG today.",
    observedStageA: {
      people: [{ name: "Dirk Didascalou", role: "Chief Technology Officer" }],
      mechanism: "APPOINTS_NAME_AS + ROLE_THEN_NAME on description",
    },
    targetAfterL1_1: {
      people: [{ name: "Dirk Didascalou", role: "Chief Technology Officer" }],
    },
  },
  {
    id: "regression-helmuth-cio-for",
    category: "regression_must_extract",
    auditNotes: "Helmuth Ludwig CIO-for-Siemens prose; must not regress when tightening ROLE_THEN_NAME.",
    provenance: {
      url: "https://www.siemens.com/",
      label: "contacts.test.ts Siemens live patterns",
      capturedOn: "2026-09-28",
    },
    title: "How Siemens CDO deals with digitalization",
    description:
      "Since October 2016 Helmuth Ludwig is the Chief Information Officer (CIO) for Siemens.",
    observedStageA: {
      people: [
        { name: "Helmuth Ludwig", role: "Chief Information Officer (CIO)" },
        { name: "Helmuth Ludwig", role: "CIO" },
      ],
      mechanism: "NAME_IS_OFFICER_PAREN_FOR / NAME_AT_COMPANY (not ROLE_THEN_NAME)",
    },
    targetAfterL1_1: {
      people: [
        { name: "Helmuth Ludwig", role: "Chief Information Officer (CIO)" },
        { name: "Helmuth Ludwig", role: "CIO" },
      ],
    },
  },
  {
    id: "regression-dirk-appoints",
    category: "regression_must_extract",
    auditNotes: "Dirk appoints-as headline path.",
    provenance: {
      url: "https://press.siemens.com/cto",
      label: "contacts.test.ts",
      capturedOn: "2026-09-28",
    },
    title: "Siemens Digital Industries appoints Dirk Didascalou as Chief Technology Officer.",
    description: "",
    observedStageA: {
      people: [{ name: "Dirk Didascalou", role: "Chief Technology Officer" }],
      mechanism: "APPOINTS_NAME_AS",
    },
    targetAfterL1_1: {
      people: [{ name: "Dirk Didascalou", role: "Chief Technology Officer" }],
    },
  },
  {
    id: "regression-hanna-wsj",
    category: "regression_must_extract",
    auditNotes: "Hanna WSJ incoming CIO + as-CIO title.",
    provenance: {
      url: "https://www.wsj.com/articles/siemens-cio",
      label: "contacts.test.ts",
      capturedOn: "2026-09-28",
    },
    title: "Siemens Taps Osram's Hanna Hennig as CIO",
    description:
      "Hanna Hennig, the incoming chief information officer at Siemens AG, will help lead digital transformation.",
    observedStageA: {
      people: [{ name: "Hanna Hennig", role: "CIO" }],
      mechanism: "NAME_AS_C_LEVEL + NAME_INCOMING_OFFICER",
    },
    targetAfterL1_1: {
      people: [{ name: "Hanna Hennig", role: "CIO" }],
    },
  },
  {
    id: "regression-vasi-evp-appointed",
    category: "regression_must_extract",
    auditNotes: "Vasi EVP appointment sentence.",
    provenance: {
      url: "https://press.siemens.com/vasi",
      label: "contacts.test.ts",
      capturedOn: "2026-09-28",
    },
    title: "AI leader Vasi Philomin joins Siemens to scale Industrial AI innovation",
    description:
      "Vasi Philomin has been appointed Executive Vice President and Head of Data & Artificial Intelligence, effective July 1, 2025.",
    observedStageA: {
      people: [
        {
          name: "Vasi Philomin",
          role: "Executive Vice President and Head of Data & Artificial Intelligence",
        },
      ],
      mechanism: "NAME_HAS_BEEN_APPOINTED",
    },
    targetAfterL1_1: {
      people: [
        {
          name: "Vasi Philomin",
          role: "Executive Vice President and Head of Data & Artificial Intelligence",
        },
      ],
    },
  },
] as const;

/** ROLE_THEN_NAME-only subset for L1.1 implementation tests. */
export const SIEMENS_ROLE_THEN_NAME_FIXTURES = SIEMENS_EXTRACTION_AUDIT_FIXTURES.filter(
  (fixture) =>
    fixture.category === "role_then_name_false_positive" ||
    fixture.category === "role_then_name_legitimate",
);
