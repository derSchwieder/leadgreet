import type {
  BusinessCaseType,
  CompanySize,
  ContactRole,
  ContentType,
  SignalType,
  SourceType,
} from "@prisma/client";

/**
 * All records created from this file MUST set isSeed = true.
 * They are synthetic demonstration data, not verified public facts.
 *
 * Real-world identifiers supplied here are the company names from the
 * product brief plus public HQ city/country. No revenue, headcount,
 * websites, people, or events are claimed as factual.
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

export const SEED_COMPANY_LOCATIONS: Record<
  (typeof SEED_COMPANY_NAMES)[number],
  { city: string; country: string }
> = {
  "VIA optronics": { city: "Nürnberg", country: "Deutschland" },
  Goldhofer: { city: "Memmingen", country: "Deutschland" },
  Schaeffler: { city: "Herzogenaurach", country: "Deutschland" },
  "ARS Altmann": { city: "Wolnzach", country: "Deutschland" },
  "SAF-HOLLAND": { city: "Bessenbach", country: "Deutschland" },
  SKZ: { city: "Würzburg", country: "Deutschland" },
  "EM Gerätebau": { city: "Mammendorf", country: "Deutschland" },
  Climaline: { city: "Würzburg", country: "Deutschland" },
  "Authentic Style": { city: "Wunstorf", country: "Deutschland" },
  WIKA: { city: "Klingenberg", country: "Deutschland" },
};

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

export interface SeedServiceSpec {
  name: string;
  description: string;
  targetIndustries: string[];
  targetCompanySizes: CompanySize[];
  targetRoles: ContactRole[];
  matchingSignalTypes: SignalType[];
  businessCaseTypes: BusinessCaseType[];
  valuePropositions: string[];
  conversationStarter: string;
}

export const SEED_SERVICES: SeedServiceSpec[] = [
  {
    name: "KI-Navigator",
    description:
      "Strukturierte Analyse der KI-Reife eines Unternehmens mit Handlungsempfehlungen und Roadmap.",
    targetIndustries: ["manufacturing", "automotive", "industrial", "machinery", "electronics"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    targetRoles: ["CIO", "CTO", "CDO", "HEAD_OF_AI", "HEAD_OF_INNOVATION", "HEAD_OF_DIGITALIZATION"],
    matchingSignalTypes: [
      "AI_PROJECT",
      "AI_STRATEGY",
      "AI_RECRUITING",
      "AI_AGENT",
      "GENAI",
      "NEW_CDO",
      "NEW_INNOVATION_LEAD",
    ],
    businessCaseTypes: ["CAPACITY", "COST_REDUCTION", "REVENUE_GROWTH"],
    valuePropositions: [
      "Bestehende Teams bei der KI-Umsetzung entlasten",
      "Manuelle Aufwände durch KI-Anwendungen reduzieren",
      "Neue KI-basierte Geschäftsmodelle ermöglichen",
      "KI-Anwendungen schneller in den Betrieb bringen",
    ],
    conversationStarter:
      "Ihre aktuelle KI-Initiative eignet sich für eine strukturierte Reifegradanalyse — wir können in einem kurzen Gespräch den nächsten konkreten Schritt klären.",
  },
  {
    name: "Data & AI",
    description:
      "Lösungen für Data Platforms, Analytics, AI und datengetriebene Geschäftsprozesse.",
    targetIndustries: ["manufacturing", "industrial", "logistics", "automotive", "electronics"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    targetRoles: ["CDO", "HEAD_OF_DATA", "HEAD_OF_AI", "CIO", "CTO"],
    matchingSignalTypes: [
      "DATA_PLATFORM",
      "DATA_ANALYTICS",
      "AI_PROJECT",
      "AI_STRATEGY",
      "GENAI",
      "AI_AGENT",
    ],
    businessCaseTypes: ["COST_REDUCTION", "REVENUE_GROWTH", "CAPACITY"],
    valuePropositions: [
      "Bestehende Daten besser nutzbar machen",
      "KI-Anwendungen schneller in den Betrieb bringen",
      "Prozesse datengetrieben automatisieren",
      "Neue datenbasierte Geschäftsmodelle ermöglichen",
    ],
    conversationStarter:
      "Wenn gerade eine Datenplattform oder Analytics-Initiative läuft, lohnt sich ein Abgleich, wo operative Prozesse schon KI-fähig gemacht werden können.",
  },
  {
    name: "Cloud Migration",
    description:
      "Migration bestehender Anwendungen und Plattformen in moderne Cloud-Architekturen.",
    targetIndustries: ["manufacturing", "industrial", "logistics", "machinery", "electronics"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    targetRoles: ["CIO", "CTO", "HEAD_OF_IT", "HEAD_OF_SOFTWARE"],
    matchingSignalTypes: [
      "CLOUD_MIGRATION",
      "SOFTWARE_MODERNIZATION",
      "ERP_TRANSFORMATION",
      "DIGITAL_TRANSFORMATION",
      "IT_REORGANIZATION",
    ],
    businessCaseTypes: ["COST_REDUCTION", "CAPACITY", "RISK_REDUCTION"],
    valuePropositions: [
      "IT-Kosten durch moderne Cloud-Architekturen senken",
      "Skalierbare Kapazität in der Cloud bereitstellen",
      "Technische Risiken bestehender Altsysteme reduzieren",
      "Anwendungen in moderne Cloud-Umgebungen überführen",
    ],
    conversationStarter:
      "Zur laufenden Cloud- oder Modernisierungsinitiative können wir den Migrationsumfang und die kritischen Workloads in einem ersten Gespräch eingrenzen.",
  },
  {
    name: "Camunda Migration",
    description: "Modernisierung und Migration von Camunda-basierten Geschäftsprozessen.",
    targetIndustries: ["manufacturing", "industrial", "logistics", "automotive", "machinery"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    targetRoles: ["CIO", "HEAD_OF_IT", "HEAD_OF_TRANSFORMATION", "COO", "HEAD_OF_DIGITALIZATION"],
    matchingSignalTypes: [
      "PROCESS_AUTOMATION",
      "ERP_TRANSFORMATION",
      "SOFTWARE_MODERNIZATION",
      "DIGITAL_TRANSFORMATION",
    ],
    businessCaseTypes: ["COST_REDUCTION", "CAPACITY", "RISK_REDUCTION"],
    valuePropositions: [
      "Manuelle Prozessaufwände durch Automatisierung reduzieren",
      "Prozesskapazität ohne zusätzlichen Personalaufbau schaffen",
      "Risiken veralteter Prozesslandschaften reduzieren",
      "Bestehende Camunda-Prozesse modernisieren",
    ],
    conversationStarter:
      "Wenn Prozessautomatisierung oder eine Camunda-Landschaft modernisiert wird, können wir den Migrationspfad und die fachlichen Engpässe schnell sichtbar machen.",
  },
  {
    name: "Individual Software",
    description: "Individuelle Softwareentwicklung und Modernisierung bestehender Anwendungen.",
    targetIndustries: ["manufacturing", "industrial", "electronics", "machinery", "automotive"],
    targetCompanySizes: ["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"],
    targetRoles: ["CTO", "HEAD_OF_SOFTWARE", "CIO", "HEAD_OF_IT"],
    matchingSignalTypes: [
      "SOFTWARE_MODERNIZATION",
      "DIGITAL_TRANSFORMATION",
      "PROCESS_AUTOMATION",
      "IT_RECRUITING",
      "EXPANSION",
    ],
    businessCaseTypes: ["CAPACITY", "REVENUE_GROWTH", "COST_REDUCTION"],
    valuePropositions: [
      "Zusätzliche Entwicklungskapazität bereitstellen",
      "Digitale Produkte schneller umsetzen",
      "Bestehende Anwendungen modernisieren",
      "Interne Teams bei der Umsetzung entlasten",
    ],
    conversationStarter:
      "Bei Software-Modernisierung oder wachsendem Anwendungsstau hilft ein kurzes Gespräch, welche Systeme sich für eine individuelle Entwicklung oder Ablösung eignen.",
  },
];

export interface SeedContentSpec {
  name: string;
  description: string;
  type: ContentType;
  serviceNames: string[];
  businessCaseTypes: BusinessCaseType[];
  targetRoles: ContactRole[];
  targetCompanySizes: CompanySize[];
  tags: string[];
}

export const SEED_CONTENT: SeedContentSpec[] = [
  {
    name: "KI-Navigator – One-Pager",
    description:
      "Kurzer Überblick über den KI-Navigator für Erstgespräche. Demo-Metadaten, keine konkrete Kundenreferenz.",
    type: "ONE_PAGER",
    serviceNames: ["KI-Navigator"],
    businessCaseTypes: ["COST_REDUCTION", "CAPACITY", "REVENUE_GROWTH"],
    targetRoles: ["CIO", "CDO", "HEAD_OF_AI", "HEAD_OF_INNOVATION"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    tags: ["KI", "Assessment", "Reifegrad"],
  },
  {
    name: "KI-Navigator – Präsentation",
    description:
      "Gesprächsleitende Präsentation zum KI-Navigator. Demo-Metadaten ohne erfundene Projekterfolge.",
    type: "PRESENTATION",
    serviceNames: ["KI-Navigator"],
    businessCaseTypes: ["COST_REDUCTION", "REVENUE_GROWTH", "CAPACITY"],
    targetRoles: ["CIO", "CDO", "HEAD_OF_AI"],
    targetCompanySizes: ["LARGE", "ENTERPRISE"],
    tags: ["KI", "Strategie", "Management"],
  },
  {
    name: "Data & AI – Leistungsübersicht",
    description:
      "Übersicht der Data-&-AI-Leistungen für Qualifizierungsgespräche. Keine konkreten Finanzaussagen.",
    type: "PRODUCT_DOCUMENT",
    serviceNames: ["Data & AI"],
    businessCaseTypes: ["COST_REDUCTION", "REVENUE_GROWTH"],
    targetRoles: ["CDO", "HEAD_OF_DATA", "CIO"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    tags: ["Daten", "KI", "Plattform"],
  },
  {
    name: "Individual Software – Referenzen",
    description:
      "Rahmen für Referenzen zur individuellen Softwareentwicklung. Ohne erfundene Kundenerfolge oder Kennzahlen.",
    type: "REFERENCE",
    serviceNames: ["Individual Software"],
    businessCaseTypes: ["CAPACITY", "COST_REDUCTION"],
    targetRoles: ["CTO", "HEAD_OF_SOFTWARE", "CIO"],
    targetCompanySizes: ["SMALL", "MEDIUM", "LARGE"],
    tags: ["Software", "Kapazität", "Referenz"],
  },
  {
    name: "Cloud Migration – Case Study",
    description:
      "Struktur einer Case Study zur Cloud-Migration. Demo-Metadaten, keine behaupteten Einsparungen.",
    type: "CASE_STUDY",
    serviceNames: ["Cloud Migration"],
    businessCaseTypes: ["COST_REDUCTION", "RISK_REDUCTION", "CAPACITY"],
    targetRoles: ["CIO", "CTO", "HEAD_OF_IT"],
    targetCompanySizes: ["MEDIUM", "LARGE", "ENTERPRISE"],
    tags: ["Cloud", "Migration", "Modernisierung"],
  },
];
