import { loadEnvConfig } from "@next/env";
import { Prisma } from "@prisma/client";
import { SCREENING_TEST_COMPANIES } from "./data/screening-test-companies";
import type { ScreeningTestCompany, ScreeningTestSignal } from "./data/screening-test-companies";
import { createSignal } from "../src/lib/db/signals";
import { createSource } from "../src/lib/db/sources";
import { findOrCreateOpportunityForCompany } from "../src/lib/db/opportunities";
import { getDemoAccountId } from "../src/lib/db/accounts";
import { isDatabaseConfigured, prisma } from "../src/lib/db/client";
import { lookupDemoCoordinates } from "../src/lib/radar/demo-coordinates";

loadEnvConfig(process.cwd());

const SOURCE_CREDIBILITY = 85;

type ExistingCompany = {
  id: string;
  name: string;
  website: string | null;
  city: string | null;
  isSeed: boolean;
  latitude: Prisma.Decimal | null;
  longitude: Prisma.Decimal | null;
};

type ExistingSignal = {
  id: string;
  companyId: string;
  sourceUrl: string | null;
};

type ExistingSource = {
  id: string;
  url: string | null;
};

type ImportDecision =
  | "import-company"
  | "skip-existing"
  | "skip-demo"
  | "skip-invalid";

type CompanyPlan = {
  record: ScreeningTestCompany;
  decision: ImportDecision;
  existing: ExistingCompany | null;
  coordinates: { latitude: number; longitude: number } | null;
  coordinateSource: "import" | "city-lookup" | null;
  signals: SignalPlan[];
  warnings: string[];
};

type SignalPlan = {
  signal: ScreeningTestSignal;
  validUrl: boolean;
  skipReason: string | null;
};

type ImportSummary = {
  companiesImported: number;
  signalsImported: number;
  skipped: number;
  warnings: string[];
  errors: string[];
};

function isDryRun(argv: string[]): boolean {
  return argv.includes("--dry-run");
}

export function normalizeWebsite(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, "") ;
    return `${host}${path}`;
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

export function normalizeSourceUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    url.hash = "";
    let href = url.href;
    if (href.endsWith("/")) href = href.slice(0, -1);
    return href.toLowerCase();
  } catch {
    return trimmed.replace(/\/+$/, "").toLowerCase();
  }
}

export function isValidHttpUrl(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseSignalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new Error(`Ungültiges Signaldatum: ${value}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function resolveCoordinates(record: ScreeningTestCompany): {
  coordinates: { latitude: number; longitude: number } | null;
  source: "import" | "city-lookup" | null;
} {
  if (
    typeof record.latitude === "number" &&
    typeof record.longitude === "number" &&
    Number.isFinite(record.latitude) &&
    Number.isFinite(record.longitude)
  ) {
    return {
      coordinates: { latitude: record.latitude, longitude: record.longitude },
      source: "import",
    };
  }

  const lookup = lookupDemoCoordinates(record.city);
  if (lookup) {
    return { coordinates: lookup, source: "city-lookup" };
  }

  return { coordinates: null, source: null };
}

function namesEqual(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase("de") === right.trim().toLocaleLowerCase("de");
}

function findExistingCompany(
  record: ScreeningTestCompany,
  companies: ExistingCompany[],
): ExistingCompany | null {
  const website = normalizeWebsite(record.website);
  if (website) {
    const byWebsite = companies.find((company) => normalizeWebsite(company.website) === website);
    if (byWebsite) return byWebsite;
  }

  return companies.find((company) => namesEqual(company.name, record.name)) ?? null;
}

function findExistingSignal(
  companyId: string,
  sourceUrl: string,
  signals: ExistingSignal[],
): ExistingSignal | undefined {
  const normalized = normalizeSourceUrl(sourceUrl);
  return signals.find(
    (signal) =>
      signal.companyId === companyId && normalizeSourceUrl(signal.sourceUrl) === normalized,
  );
}

function collectDatasetDuplicates(records: ScreeningTestCompany[]): string[] {
  const warnings: string[] = [];
  const names = new Map<string, number>();
  const websites = new Map<string, number>();
  const sourceUrls = new Map<string, number>();

  for (const record of records) {
    const nameKey = record.name.trim().toLocaleLowerCase("de");
    names.set(nameKey, (names.get(nameKey) ?? 0) + 1);
    const website = normalizeWebsite(record.website);
    if (website) websites.set(website, (websites.get(website) ?? 0) + 1);
    for (const signal of record.signals) {
      const url = normalizeSourceUrl(signal.source.url);
      if (url) sourceUrls.set(url, (sourceUrls.get(url) ?? 0) + 1);
    }
  }

  for (const [name, count] of names) {
    if (count > 1) warnings.push(`Mögliches Duplikat im Datensatz: Firmenname „${name}“ (${count}×)`);
  }
  for (const [website, count] of websites) {
    if (count > 1) warnings.push(`Mögliches Duplikat im Datensatz: Website ${website} (${count}×)`);
  }
  for (const [url, count] of sourceUrls) {
    if (count > 1) warnings.push(`Mögliches Duplikat im Datensatz: Signal-URL ${url} (${count}×)`);
  }

  return warnings;
}

function planImports(
  records: ScreeningTestCompany[],
  companies: ExistingCompany[],
  signals: ExistingSignal[],
): { plans: CompanyPlan[]; warnings: string[] } {
  const warnings = collectDatasetDuplicates(records);
  const plans: CompanyPlan[] = records.map((record) => {
    const existing = findExistingCompany(record, companies);
    const { coordinates, source } = resolveCoordinates(record);
    const companyWarnings: string[] = [];

    if (!coordinates) {
      companyWarnings.push(
        `Keine Koordinaten für ${record.name} (${record.city}): weder Import-Lat/Lng noch Stadt-Lookup. Datensatz wird nicht falsch platziert.`,
      );
    }

    let decision: ImportDecision = "import-company";
    if (existing?.isSeed) {
      decision = "skip-demo";
      companyWarnings.push(
        `Demo-Unternehmen unangetastet: ${existing.name} (isSeed=true). Screening-Import überspringt Firma und Signale.`,
      );
    } else if (existing) {
      decision = "skip-existing";
      companyWarnings.push(
        `Bestehendes Unternehmen übersprungen, nicht überschrieben: ${existing.name}.`,
      );
    }

    if (record.isSeed !== false) {
      decision = "skip-invalid";
      companyWarnings.push(`${record.name}: isSeed muss false sein.`);
    }

    const signalPlans: SignalPlan[] = record.signals.map((signal) => {
      const validUrl = isValidHttpUrl(signal.source.url);
      if (!validUrl) {
        return {
          signal,
          validUrl: false,
          skipReason: `Signal ohne gültige URL bei ${record.name}: „${signal.title}“`,
        };
      }

      if (decision === "skip-demo" || decision === "skip-invalid") {
        return {
          signal,
          validUrl: true,
          skipReason: `Signal übersprungen, weil ${record.name} nicht importiert wird.`,
        };
      }

      if (existing) {
        const match = findExistingSignal(existing.id, signal.source.url, signals);
        if (match) {
          return {
            signal,
            validUrl: true,
            skipReason: `Signal bereits vorhanden (${record.name}): ${signal.source.url}`,
          };
        }
      }

      return { signal, validUrl: true, skipReason: null };
    });

    for (const signalPlan of signalPlans) {
      if (signalPlan.skipReason) companyWarnings.push(signalPlan.skipReason);
    }

    if (record.signals.length === 0) {
      companyWarnings.push(`${record.name}: kein Signal im Datensatz.`);
    }

    return {
      record,
      decision,
      existing,
      coordinates,
      coordinateSource: source,
      signals: signalPlans,
      warnings: companyWarnings,
    };
  });

  return { plans, warnings: [...warnings, ...plans.flatMap((plan) => plan.warnings)] };
}

async function findOrCreateSource(
  signal: ScreeningTestSignal,
  existingSources: ExistingSource[],
  dryRun: boolean,
): Promise<string | null> {
  const normalized = normalizeSourceUrl(signal.source.url);
  const match = existingSources.find((source) => normalizeSourceUrl(source.url) === normalized);
  if (match) return match.id;
  if (dryRun) return null;

  const created = await createSource({
    name: signal.source.name,
    url: signal.source.url,
    sourceType: signal.source.sourceType,
    publishedAt: parseSignalDate(signal.date),
    accessedAt: new Date(),
    credibilityScore: SOURCE_CREDIBILITY,
    isSeed: false,
  });
  existingSources.push({ id: created.id, url: created.url });
  return created.id;
}

async function importCompany(
  plan: CompanyPlan,
  accountId: string,
  existingSources: ExistingSource[],
  existingSignals: ExistingSignal[],
  dryRun: boolean,
  summary: ImportSummary,
): Promise<void> {
  if (plan.decision === "skip-demo" || plan.decision === "skip-invalid") {
    summary.skipped += 1 + plan.signals.length;
    return;
  }

  let companyId = plan.existing?.id ?? null;

  if (plan.decision === "import-company") {
    if (dryRun) {
      summary.companiesImported += 1;
    } else {
      const created = await prisma.company.create({
        data: {
          name: plan.record.name,
          website: plan.record.website,
          industry: plan.record.industry ?? null,
          city: plan.record.city,
          country: plan.record.country,
          ...(plan.record.employees != null ? { employees: plan.record.employees } : {}),
          latitude: plan.coordinates?.latitude ?? null,
          longitude: plan.coordinates?.longitude ?? null,
          isSeed: false,
        },
      });
      companyId = created.id;
      summary.companiesImported += 1;
    }
  } else {
    summary.skipped += 1;
  }

  for (const signalPlan of plan.signals) {
    if (!signalPlan.validUrl || signalPlan.skipReason) {
      summary.skipped += 1;
      continue;
    }

    if (dryRun) {
      summary.signalsImported += 1;
      continue;
    }

    if (!companyId) {
      summary.errors.push(`Kein companyId für Signal „${signalPlan.signal.title}“.`);
      continue;
    }

    try {
      const sourceId = await findOrCreateSource(signalPlan.signal, existingSources, dryRun);
      const eventDate = parseSignalDate(signalPlan.signal.date);
      const created = await createSignal({
        companyId,
        type: signalPlan.signal.type,
        title: signalPlan.signal.title,
        description: signalPlan.signal.description,
        detectedAt: eventDate,
        eventDate,
        sourceId,
        sourceUrl: signalPlan.signal.source.url,
        sourceName: signalPlan.signal.source.name,
        isSeed: false,
      });
      existingSignals.push({
        id: created.id,
        companyId,
        sourceUrl: created.sourceUrl,
      });
      summary.signalsImported += 1;
    } catch (error) {
      summary.errors.push(
        `Signal „${signalPlan.signal.title}“ (${plan.record.name}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  if (dryRun || !companyId) return;

  try {
    await findOrCreateOpportunityForCompany(accountId, companyId);
  } catch (error) {
    summary.errors.push(
      `Opportunity für ${plan.record.name}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function printDryRun(plans: CompanyPlan[], extraWarnings: string[]): void {
  const companies = plans.length;
  const signals = plans.reduce((sum, plan) => sum + plan.signals.length, 0);
  const newCompanies = plans.filter((plan) => plan.decision === "import-company").length;
  const existingCompanies = plans.filter((plan) => plan.decision === "skip-existing").length;
  const demoCompanies = plans.filter((plan) => plan.decision === "skip-demo").length;
  const withoutCoordinates = plans.filter((plan) => !plan.coordinates);
  const withoutUrl = plans.flatMap((plan) => plan.signals.filter((signal) => !signal.validUrl));
  const possibleDuplicates = [
    ...extraWarnings.filter((warning) => warning.startsWith("Mögliches Duplikat")),
    ...plans
      .filter((plan) => plan.decision === "skip-existing" || plan.decision === "skip-demo")
      .map((plan) =>
        plan.decision === "skip-demo"
          ? `Demo-Treffer: ${plan.record.name}`
          : `Bereits in der Datenbank: ${plan.record.name}`,
      ),
  ];

  console.log("DRY RUN (keine Datenbank-Schreibzugriffe)");
  console.log("----------------------------------------");
  console.log(`Anzahl Unternehmen: ${companies}`);
  console.log(`Anzahl Signals: ${signals}`);
  console.log(`Neue Unternehmen: ${newCompanies}`);
  console.log(`Bereits vorhandene Unternehmen: ${existingCompanies}${demoCompanies ? ` (davon Demo: ${demoCompanies})` : ""}`);
  console.log(`Unternehmen ohne Koordinaten: ${withoutCoordinates.length}`);
  for (const plan of withoutCoordinates) {
    console.log(`  - ${plan.record.name} (${plan.record.city})`);
  }
  console.log(`Signals ohne gültige URL: ${withoutUrl.length}`);
  for (const signal of withoutUrl) {
    console.log(`  - ${signal.signal.title}`);
  }
  console.log(`Mögliche Duplikate: ${possibleDuplicates.length}`);
  for (const item of possibleDuplicates) {
    console.log(`  - ${item}`);
  }
  console.log("");
}

function printSummary(summary: ImportSummary, dryRun: boolean): void {
  console.log("SCREENING IMPORT");
  console.log("----------------");
  if (dryRun) {
    console.log("Mode: dry-run (keine Schreibzugriffe)");
  }
  console.log(`Companies imported: ${summary.companiesImported}`);
  console.log(`Signals imported: ${summary.signalsImported}`);
  console.log(`Skipped: ${summary.skipped}`);
  console.log(`Warnings: ${summary.warnings.length}`);
  for (const warning of summary.warnings) {
    console.log(`  - ${warning}`);
  }
  console.log(`Errors: ${summary.errors.length}`);
  for (const error of summary.errors) {
    console.log(`  - ${error}`);
  }
}

async function main(): Promise<void> {
  const dryRun = isDryRun(process.argv);
  const summary: ImportSummary = {
    companiesImported: 0,
    signalsImported: 0,
    skipped: 0,
    warnings: [],
    errors: [],
  };

  if (!isDatabaseConfigured()) {
    summary.errors.push("DATABASE_URL ist nicht gesetzt. Dry-Run kann vorhandene Datensätze nicht prüfen.");
    const { plans, warnings } = planImports(SCREENING_TEST_COMPANIES, [], []);
    summary.warnings.push(...warnings);
    if (dryRun) printDryRun(plans, warnings);
    printSummary(summary, dryRun);
    process.exitCode = 1;
    return;
  }

  const [companies, signals, sources] = await Promise.all([
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        website: true,
        city: true,
        isSeed: true,
        latitude: true,
        longitude: true,
      },
    }),
    prisma.signal.findMany({
      select: { id: true, companyId: true, sourceUrl: true },
    }),
    prisma.source.findMany({
      select: { id: true, url: true },
    }),
  ]);

  const { plans, warnings } = planImports(SCREENING_TEST_COMPANIES, companies, signals);
  summary.warnings.push(...warnings);

  if (dryRun) {
    printDryRun(plans, warnings);
    for (const plan of plans) {
      await importCompany(plan, "", sources, signals, true, summary);
    }
    printSummary(summary, true);
    return;
  }

  const accountId = await getDemoAccountId();
  for (const plan of plans) {
    await importCompany(plan, accountId, sources, signals, false, summary);
  }

  printSummary(summary, false);
}

main()
  .catch((error) => {
    console.error("SCREENING IMPORT");
    console.error("----------------");
    console.error("Companies imported: 0");
    console.error("Signals imported: 0");
    console.error("Skipped: 0");
    console.error("Warnings: 0");
    console.error(`Errors: 1`);
    console.error(`  - ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (isDatabaseConfigured()) {
      await prisma.$disconnect();
    }
  });
