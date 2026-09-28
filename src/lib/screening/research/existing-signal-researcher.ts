import type { CompanyScreeningSignalRef, ScreeningSource } from "@/types";
import type { LocalCatalogSignal, SignalResearchFinding } from "./types";

const DAY = 86_400_000;

export function selectRecentSignals(
  signals: readonly LocalCatalogSignal[],
  now = new Date(),
): LocalCatalogSignal[] {
  return signals.filter((signal) => {
    const age = now.getTime() - signal.detectedAt.getTime();
    return age <= 365 * DAY;
  });
}

export function toScreeningSignals(
  signals: readonly LocalCatalogSignal[],
  now = new Date(),
): CompanyScreeningSignalRef[] {
  return selectRecentSignals(signals, now).map((signal) => {
    const age = now.getTime() - signal.detectedAt.getTime();
    const relevance = age <= 90 * DAY ? 80 : 50;
    return {
      signalId: signal.id,
      signalType: signal.type,
      title: signal.title,
      description: signal.description,
      source: signal.sourceName,
      sourceUrl: signal.sourceUrl,
      date: signal.detectedAt.toISOString(),
      relevance,
      kind: "SIGNAL",
    };
  });
}

export function sourcesFromSignals(signals: readonly CompanyScreeningSignalRef[]): ScreeningSource[] {
  return signals.flatMap((signal) => {
    if (!signal.title || (!signal.source && !signal.sourceUrl)) return [];
    return [
      {
        title: signal.title,
        url: signal.sourceUrl ?? null,
        publisher: signal.source ?? null,
        publishedAt: signal.date ?? null,
      },
    ];
  });
}

export async function researchExistingSignals(
  listSignals: (companyId: string) => Promise<LocalCatalogSignal[]>,
  companyId: string | null,
  now = new Date(),
): Promise<SignalResearchFinding> {
  if (!companyId) return { signals: [], sources: [] };
  const mapped = toScreeningSignals(await listSignals(companyId), now);
  return { signals: mapped, sources: sourcesFromSignals(mapped) };
}
