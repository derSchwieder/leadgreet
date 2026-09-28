import { loadEnvConfig } from "@next/env";
import { CURRENT_SIGNALS_2026 } from "./data/current-signals-2026";
import { createSignal } from "../src/lib/db/signals";
import { createSource } from "../src/lib/db/sources";
import { isDatabaseConfigured, prisma } from "../src/lib/db/client";
import {
  findExistingSource,
  isValidHttpUrl,
  planCurrentSignals,
  type CurrentSignalPlan,
  type ExistingSource,
} from "../src/lib/import/current-signals-plan";

loadEnvConfig(process.cwd());

const SOURCE_CREDIBILITY = 85;

type ImportSummary = {
  companiesCreated: number;
  signalsImported: number;
  sourcesCreated: number;
  skipped: number;
  warnings: string[];
  errors: string[];
};

function isDryRun(argv: string[]): boolean {
  return argv.includes("--dry-run");
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

function printDryRun(plans: CurrentSignalPlan[], extraWarnings: string[]): void {
  const foundCompanies = new Set(
    plans.filter((plan) => plan.companyDecision === "gefunden").map((plan) => plan.record.company.name),
  );
  const newCompanies = new Set(
    plans.filter((plan) => plan.companyDecision === "neu").map((plan) => plan.record.company.name),
  );
  const seedCompanies = new Set(
    plans.filter((plan) => plan.companyDecision === "skip-seed").map((plan) => plan.record.company.name),
  );
  const signalsNew = plans.filter((plan) => plan.signalDecision === "neu");
  const signalsExisting = plans.filter((plan) => plan.signalDecision === "existing");
  const sourcesNew = plans.filter((plan) => plan.sourceDecision === "neu");
  const sourcesExisting = plans.filter((plan) => plan.sourceDecision === "existing");
  const withoutUrl = plans.filter((plan) => !plan.validUrl);
  const datasetDuplicates = extraWarnings.filter((warning) => warning.startsWith("Mögliches Duplikat"));

  console.log("DRY RUN (keine Datenbank-Schreibzugriffe)");
  console.log("----------------------------------------");
  console.log(`Anzahl Signals: ${plans.length}`);
  console.log(`Companies gefunden: ${foundCompanies.size}`);
  for (const name of foundCompanies) {
    console.log(`  - ${name}`);
  }
  console.log(`Companies neu: ${newCompanies.size}`);
  for (const name of newCompanies) {
    console.log(`  - ${name}`);
  }
  console.log(`Companies Demo übersprungen: ${seedCompanies.size}`);
  for (const name of seedCompanies) {
    console.log(`  - ${name}`);
  }
  console.log(`Signals neu: ${signalsNew.length}`);
  for (const plan of signalsNew) {
    console.log(`  - ${plan.record.company.name}: ${plan.record.title}`);
  }
  console.log(`Signals existing: ${signalsExisting.length}`);
  for (const plan of signalsExisting) {
    console.log(`  - ${plan.record.company.name}: ${plan.record.source.url}`);
  }
  console.log(`Sources neu: ${sourcesNew.length}`);
  for (const plan of sourcesNew) {
    console.log(`  - ${plan.record.source.name}: ${plan.record.source.url}`);
  }
  console.log(`Sources existing: ${sourcesExisting.length}`);
  for (const plan of sourcesExisting) {
    console.log(`  - ${plan.record.source.name}: ${plan.record.source.url}`);
  }
  console.log(`Signals ohne gültige URL: ${withoutUrl.length}`);
  for (const plan of withoutUrl) {
    console.log(`  - ${plan.record.title}`);
  }
  console.log(`Mögliche Duplikate: ${datasetDuplicates.length}`);
  for (const item of datasetDuplicates) {
    console.log(`  - ${item}`);
  }
  console.log("Opportunities: keine (dieser Import legt keine Opportunities an)");
  console.log("");
  console.log("Je Signal");
  console.log("---------");
  for (const plan of plans) {
    console.log(
      `- ${plan.record.company.name} | Company ${plan.companyDecision} | Signal ${plan.signalDecision} | Source ${plan.sourceDecision} | ${plan.record.date}`,
    );
  }
  console.log("");
}

function printSummary(summary: ImportSummary, dryRun: boolean): void {
  console.log("CURRENT SIGNALS 2026 IMPORT");
  console.log("---------------------------");
  if (dryRun) {
    console.log("Mode: dry-run (keine Schreibzugriffe)");
  }
  console.log(`Companies created: ${summary.companiesCreated}`);
  console.log(`Signals imported: ${summary.signalsImported}`);
  console.log(`Sources created: ${summary.sourcesCreated}`);
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

async function findOrCreateSource(
  plan: CurrentSignalPlan,
  existingSources: ExistingSource[],
  dryRun: boolean,
  summary: ImportSummary,
): Promise<string | null> {
  const match = findExistingSource(plan.record.source.url, existingSources);
  if (match) return match.id;
  if (dryRun) {
    summary.sourcesCreated += 1;
    return null;
  }

  const created = await createSource({
    name: plan.record.source.name,
    url: plan.record.source.url,
    sourceType: plan.record.source.sourceType,
    publishedAt: parseSignalDate(plan.record.date),
    accessedAt: new Date(),
    credibilityScore: SOURCE_CREDIBILITY,
    isSeed: false,
  });
  existingSources.push({ id: created.id, url: created.url });
  summary.sourcesCreated += 1;
  return created.id;
}

async function importPlan(
  plan: CurrentSignalPlan,
  existingSources: ExistingSource[],
  dryRun: boolean,
  summary: ImportSummary,
  createdCompanyIds: Map<string, string>,
): Promise<void> {
  if (plan.companyDecision === "skip-seed" || plan.signalDecision === "skip") {
    summary.skipped += 1;
    return;
  }

  if (plan.signalDecision === "existing") {
    summary.skipped += 1;
    return;
  }

  let companyId = plan.company?.id ?? createdCompanyIds.get(plan.record.company.website) ?? null;

  if (plan.companyDecision === "neu" && !companyId) {
    if (dryRun) {
      summary.companiesCreated += 1;
      createdCompanyIds.set(plan.record.company.website, "dry-run-company");
    } else {
      const created = await prisma.company.create({
        data: {
          name: plan.record.company.name,
          website: plan.record.company.website,
          industry: plan.record.company.industry ?? null,
          city: plan.record.company.city,
          country: plan.record.company.country,
          latitude: plan.record.company.latitude ?? null,
          longitude: plan.record.company.longitude ?? null,
          isSeed: false,
        },
      });
      companyId = created.id;
      createdCompanyIds.set(plan.record.company.website, created.id);
      summary.companiesCreated += 1;
    }
  }

  if (dryRun) {
    if (plan.sourceDecision === "neu") summary.sourcesCreated += 1;
    summary.signalsImported += 1;
    return;
  }

  if (!companyId) {
    summary.errors.push(`Kein companyId für Signal „${plan.record.title}“.`);
    return;
  }

  if (!isValidHttpUrl(plan.record.source.url)) {
    summary.skipped += 1;
    return;
  }

  try {
    const sourceId = await findOrCreateSource(plan, existingSources, dryRun, summary);
    const eventDate = parseSignalDate(plan.record.date);
    await createSignal({
      companyId,
      type: plan.record.type,
      title: plan.record.title,
      description: plan.record.description,
      detectedAt: eventDate,
      eventDate,
      sourceId,
      sourceUrl: plan.record.source.url,
      sourceName: plan.record.source.name,
      isSeed: false,
    });
    summary.signalsImported += 1;
  } catch (error) {
    summary.errors.push(
      `Signal „${plan.record.title}“ (${plan.record.company.name}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function main(): Promise<void> {
  const dryRun = isDryRun(process.argv);
  const summary: ImportSummary = {
    companiesCreated: 0,
    signalsImported: 0,
    sourcesCreated: 0,
    skipped: 0,
    warnings: [],
    errors: [],
  };

  if (!isDatabaseConfigured()) {
    summary.errors.push("DATABASE_URL ist nicht gesetzt. Dry-Run kann vorhandene Datensätze nicht prüfen.");
    const { plans, warnings } = planCurrentSignals(CURRENT_SIGNALS_2026, [], [], []);
    summary.warnings.push(...warnings);
    if (dryRun) printDryRun(plans, warnings);
    printSummary(summary, dryRun);
    process.exitCode = 1;
    return;
  }

  const [companies, signals, sources] = await Promise.all([
    prisma.company.findMany({
      select: { id: true, name: true, website: true, isSeed: true },
    }),
    prisma.signal.findMany({
      select: { id: true, companyId: true, sourceUrl: true },
    }),
    prisma.source.findMany({
      select: { id: true, url: true },
    }),
  ]);

  const { plans, warnings } = planCurrentSignals(CURRENT_SIGNALS_2026, companies, signals, sources);
  summary.warnings.push(...warnings);

  if (dryRun) {
    printDryRun(plans, warnings);
    const createdCompanyIds = new Map<string, string>();
    for (const plan of plans) {
      await importPlan(plan, sources, true, summary, createdCompanyIds);
    }
    printSummary(summary, true);
    return;
  }

  const createdCompanyIds = new Map<string, string>();
  for (const plan of plans) {
    await importPlan(plan, sources, false, summary, createdCompanyIds);
  }

  printSummary(summary, false);
}

main()
  .catch((error) => {
    console.error("CURRENT SIGNALS 2026 IMPORT");
    console.error("---------------------------");
    console.error("Companies created: 0");
    console.error("Signals imported: 0");
    console.error("Sources created: 0");
    console.error("Skipped: 0");
    console.error("Warnings: 0");
    console.error("Errors: 1");
    console.error(`  - ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (isDatabaseConfigured()) {
      await prisma.$disconnect();
    }
  });
