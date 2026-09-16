import type { ContactRole, SignalType, SourceType } from "@prisma/client";

/**
 * All records created from this file MUST set isSeed = true.
 * They are synthetic demonstration data, not verified public facts.
 *
 * The only real-world identifiers supplied here are the company names
 * listed in the product brief. No revenue, headcount, websites, people,
 * or events are claimed as factual.
 */
export const SEED_DISCLAIMER =
  "DEMO / SEED DATA. Synthetic records for product walkthrough. Not verified public information. Safe to delete via isSeed = true.";

export const SEED_COMPANY_NAMES = [
  "VIA optronics",
  "Goldhofer",
  "Schaeffler",
  "ARS Altmann",
  "SAF-HOLLAND",
  "SKZ",
  "EM Gerätebau",
  "Climaline",
  "Authentic Style",
  "WIKA",
] as const;

export interface SeedSource {
  key: string;
  name: string;
  sourceType: SourceType;
  credibilityScore: number;
}

export const SEED_SOURCES: SeedSource[] = [
  {
    key: "press",
    name: "[DEMO] Press desk feed",
    sourceType: "PRESS_RELEASE",
    credibilityScore: 78,
  },
  {
    key: "news",
    name: "[DEMO] Trade news monitor",
    sourceType: "NEWS",
    credibilityScore: 64,
  },
  {
    key: "jobs",
    name: "[DEMO] Careers board",
    sourceType: "JOB_POSTING",
    credibilityScore: 72,
  },
  {
    key: "web",
    name: "[DEMO] Company website snapshot",
    sourceType: "COMPANY_WEBSITE",
    credibilityScore: 80,
  },
  {
    key: "funding",
    name: "[DEMO] Funding monitor",
    sourceType: "FUNDING",
    credibilityScore: 70,
  },
];

export interface SeedSignalSpec {
  companyName: (typeof SEED_COMPANY_NAMES)[number];
  type: SignalType;
  title: string;
  description: string;
  sourceKey: string;
  daysAgo: number;
}

export const SEED_SIGNALS: SeedSignalSpec[] = [
  {
    companyName: "VIA optronics",
    type: "AI_PROJECT",
    title: "[DEMO] AI project exploration",
    description: `${SEED_DISCLAIMER} Placeholder signal used to demonstrate AI-project scoring.`,
    sourceKey: "press",
    daysAgo: 4,
  },
  {
    companyName: "VIA optronics",
    type: "GENAI",
    title: "[DEMO] Generative AI capability review",
    description: `${SEED_DISCLAIMER} Placeholder signal for GenAI category coverage.`,
    sourceKey: "web",
    daysAgo: 11,
  },
  {
    companyName: "Goldhofer",
    type: "CLOUD_MIGRATION",
    title: "[DEMO] Cloud migration scoping",
    description: `${SEED_DISCLAIMER} Placeholder signal for cloud category coverage.`,
    sourceKey: "news",
    daysAgo: 6,
  },
  {
    companyName: "Schaeffler",
    type: "DATA_PLATFORM",
    title: "[DEMO] Data platform initiative",
    description: `${SEED_DISCLAIMER} Placeholder signal for data category coverage.`,
    sourceKey: "press",
    daysAgo: 3,
  },
  {
    companyName: "Schaeffler",
    type: "PROCESS_AUTOMATION",
    title: "[DEMO] Process automation assessment",
    description: `${SEED_DISCLAIMER} Placeholder signal for automation category coverage.`,
    sourceKey: "jobs",
    daysAgo: 9,
  },
  {
    companyName: "ARS Altmann",
    type: "DIGITAL_TRANSFORMATION",
    title: "[DEMO] Digital transformation program",
    description: `${SEED_DISCLAIMER} Placeholder signal for IT transformation coverage.`,
    sourceKey: "web",
    daysAgo: 5,
  },
  {
    companyName: "SAF-HOLLAND",
    type: "NEW_CIO",
    title: "[DEMO] Leadership change — CIO role",
    description: `${SEED_DISCLAIMER} Placeholder leadership signal. Not a statement about a real appointment.`,
    sourceKey: "news",
    daysAgo: 2,
  },
  {
    companyName: "SKZ",
    type: "AI_STRATEGY",
    title: "[DEMO] AI strategy workshop",
    description: `${SEED_DISCLAIMER} Placeholder signal for AI strategy scoring.`,
    sourceKey: "web",
    daysAgo: 8,
  },
  {
    companyName: "EM Gerätebau",
    type: "IT_RECRUITING",
    title: "[DEMO] IT recruiting activity",
    description: `${SEED_DISCLAIMER} Placeholder signal derived from a fictional job-board snapshot.`,
    sourceKey: "jobs",
    daysAgo: 1,
  },
  {
    companyName: "Climaline",
    type: "ERP_TRANSFORMATION",
    title: "[DEMO] ERP transformation planning",
    description: `${SEED_DISCLAIMER} Placeholder signal for ERP / automation scoring.`,
    sourceKey: "press",
    daysAgo: 7,
  },
  {
    companyName: "Authentic Style",
    type: "SOFTWARE_MODERNIZATION",
    title: "[DEMO] Software modernization backlog",
    description: `${SEED_DISCLAIMER} Placeholder signal for modernization scoring.`,
    sourceKey: "web",
    daysAgo: 12,
  },
  {
    companyName: "WIKA",
    type: "INVESTMENT",
    title: "[DEMO] Investment / expansion watch",
    description: `${SEED_DISCLAIMER} Placeholder signal for investment category coverage.`,
    sourceKey: "funding",
    daysAgo: 10,
  },
  {
    companyName: "WIKA",
    type: "DATA_ANALYTICS",
    title: "[DEMO] Data analytics capability",
    description: `${SEED_DISCLAIMER} Placeholder signal for analytics scoring.`,
    sourceKey: "news",
    daysAgo: 15,
  },
];

export interface SeedContactSpec {
  companyName: (typeof SEED_COMPANY_NAMES)[number];
  firstName: string;
  lastName: string;
  role: ContactRole;
  isDecisionMaker: boolean;
}

export const SEED_CONTACTS: SeedContactSpec[] = [
  { companyName: "VIA optronics", firstName: "Seed", lastName: "CIO", role: "CIO", isDecisionMaker: true },
  { companyName: "Goldhofer", firstName: "Seed", lastName: "CTO", role: "CTO", isDecisionMaker: true },
  { companyName: "Schaeffler", firstName: "Seed", lastName: "CDO", role: "CDO", isDecisionMaker: true },
  { companyName: "ARS Altmann", firstName: "Seed", lastName: "IT", role: "HEAD_OF_IT", isDecisionMaker: true },
  { companyName: "SAF-HOLLAND", firstName: "Seed", lastName: "CIO", role: "CIO", isDecisionMaker: true },
  { companyName: "SKZ", firstName: "Seed", lastName: "Innovation", role: "HEAD_OF_INNOVATION", isDecisionMaker: true },
  { companyName: "EM Gerätebau", firstName: "Seed", lastName: "Director", role: "MANAGING_DIRECTOR", isDecisionMaker: true },
  { companyName: "Climaline", firstName: "Seed", lastName: "Transformation", role: "HEAD_OF_TRANSFORMATION", isDecisionMaker: true },
  { companyName: "Authentic Style", firstName: "Seed", lastName: "Software", role: "HEAD_OF_SOFTWARE", isDecisionMaker: false },
  { companyName: "WIKA", firstName: "Seed", lastName: "CEO", role: "CEO", isDecisionMaker: true },
];
