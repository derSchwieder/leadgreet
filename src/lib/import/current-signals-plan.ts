import { CURRENT_SIGNALS_2026, type CurrentSignalRecord } from "../../../scripts/data/current-signals-2026";

export type ExistingCompany = {
  id: string;
  name: string;
  website: string | null;
  isSeed: boolean;
};

export type ExistingSignal = {
  id: string;
  companyId: string;
  sourceUrl: string | null;
};

export type ExistingSource = {
  id: string;
  url: string | null;
};

export type CompanyDecision = "gefunden" | "neu" | "skip-seed";
export type SignalDecision = "neu" | "existing" | "skip";
export type SourceDecision = "neu" | "existing" | "skip";

export type CurrentSignalPlan = {
  record: CurrentSignalRecord;
  company: ExistingCompany | null;
  companyDecision: CompanyDecision;
  signalDecision: SignalDecision;
  sourceDecision: SourceDecision;
  validUrl: boolean;
  warnings: string[];
};

export function normalizeWebsite(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = url.pathname.replace(/\/+$/, "");
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

function namesEqual(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase("de") === right.trim().toLocaleLowerCase("de");
}

export function findExistingCompany(
  record: CurrentSignalRecord,
  companies: ExistingCompany[],
): ExistingCompany | null {
  const website = normalizeWebsite(record.company.website);
  if (website) {
    const byWebsite = companies.find((company) => normalizeWebsite(company.website) === website);
    if (byWebsite) return byWebsite;
  }
  return companies.find((company) => namesEqual(company.name, record.company.name)) ?? null;
}

export function findExistingSignal(
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

export function findExistingSource(
  sourceUrl: string,
  sources: ExistingSource[],
): ExistingSource | undefined {
  const normalized = normalizeSourceUrl(sourceUrl);
  return sources.find((source) => normalizeSourceUrl(source.url) === normalized);
}

function collectDatasetDuplicates(records: CurrentSignalRecord[]): string[] {
  const warnings: string[] = [];
  const sourceUrls = new Map<string, number>();

  for (const record of records) {
    const url = normalizeSourceUrl(record.source.url);
    if (url) sourceUrls.set(url, (sourceUrls.get(url) ?? 0) + 1);
  }

  for (const [url, count] of sourceUrls) {
    if (count > 1) warnings.push(`Mögliches Duplikat im Datensatz: Signal-URL ${url} (${count}×)`);
  }

  return warnings;
}

/**
 * Signals are unique per (companyId + sourceUrl). Title and date are not used.
 * Existing companies are reused. Seed companies are not written to.
 */
export function planCurrentSignals(
  records: CurrentSignalRecord[] = CURRENT_SIGNALS_2026,
  companies: ExistingCompany[] = [],
  signals: ExistingSignal[] = [],
  sources: ExistingSource[] = [],
): { plans: CurrentSignalPlan[]; warnings: string[] } {
  const warnings = collectDatasetDuplicates(records);
  const plannedCompanies = new Map<string, CompanyDecision>();

  const plans = records.map((record) => {
    const existing = findExistingCompany(record, companies);
    const validUrl = isValidHttpUrl(record.source.url);
    const planWarnings: string[] = [];

    if (record.company.isSeed !== false) {
      planWarnings.push(`${record.company.name}: isSeed muss false sein.`);
    }

    let companyDecision: CompanyDecision = existing ? "gefunden" : "neu";
    if (existing?.isSeed) {
      companyDecision = "skip-seed";
      planWarnings.push(
        `Demo-Unternehmen unangetastet: ${existing.name}. Current-Signal wird nicht angehängt.`,
      );
    }

    const companyKey = normalizeWebsite(record.company.website) ?? record.company.name;
    const previousCompanyDecision = plannedCompanies.get(companyKey);
    if (!existing && previousCompanyDecision === "neu") {
      companyDecision = "gefunden";
    } else if (!existing && companyDecision === "neu") {
      plannedCompanies.set(companyKey, "neu");
    } else if (existing) {
      plannedCompanies.set(companyKey, companyDecision);
    }

    let signalDecision: SignalDecision = "neu";
    let sourceDecision: SourceDecision = "neu";

    if (!validUrl) {
      signalDecision = "skip";
      sourceDecision = "skip";
      planWarnings.push(
        `Signal ohne gültige URL bei ${record.company.name}: „${record.title}“`,
      );
    } else if (companyDecision === "skip-seed") {
      signalDecision = "skip";
      sourceDecision = findExistingSource(record.source.url, sources) ? "existing" : "neu";
      planWarnings.push(`Signal übersprungen, weil ${record.company.name} ein Demo-Datensatz ist.`);
    } else {
      const sourceMatch = findExistingSource(record.source.url, sources);
      sourceDecision = sourceMatch ? "existing" : "neu";

      if (existing) {
        const signalMatch = findExistingSignal(existing.id, record.source.url, signals);
        if (signalMatch) {
          signalDecision = "existing";
          planWarnings.push(
            `Signal bereits vorhanden (${record.company.name}): ${record.source.url}`,
          );
        }
      }
    }

    warnings.push(...planWarnings);

    return {
      record,
      company: existing,
      companyDecision,
      signalDecision,
      sourceDecision,
      validUrl,
      warnings: planWarnings,
    };
  });

  return { plans, warnings };
}
