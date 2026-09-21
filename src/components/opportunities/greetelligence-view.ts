import { formatDate, formatDays } from "@/lib/format";
import { SIGNAL_TYPE_LABELS, SOURCE_TYPE_LABELS } from "@/lib/labels";

export function daysSince(value: Date | string, now = new Date()): number | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const start = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.round((today - start) / 86_400_000));
}

export function signalTypeHeadline(type: string | null | undefined): string | null {
  if (!type) return null;
  return SIGNAL_TYPE_LABELS[type] ?? null;
}

export function recencyLabel(days: number): string {
  if (days <= 0) return "Heute";
  if (days === 1) return "vor 1 Tag";
  return `vor ${days} Tagen`;
}

export type WhyNowSignalInput = {
  id: string;
  type: string;
  title: string;
  detectedAt: Date | string;
  signalStrength?: number | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceType?: string | null;
};

export type WhyNowSourceView = {
  typeLabel: string | null;
  name: string | null;
  url: string | null;
  date: string | null;
  missing: boolean;
};

export type WhyNowSupportingSignal = {
  id: string;
  title: string;
  category: string | null;
  age: string;
  strength: number | null;
};

export type WhyNowView = {
  category: string | null;
  title: string;
  age: string | null;
  strength: number | null;
  source: WhyNowSourceView;
  interpretation: string;
  supporting: WhyNowSupportingSignal[];
};

function finiteStrength(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sourceTypeLabel(type: string | null | undefined): string | null {
  if (!type) return null;
  return SOURCE_TYPE_LABELS[type] ?? null;
}

export function selectWhyNowSignal(
  signals: WhyNowSignalInput[] | null | undefined,
  triggerId?: string | null,
): WhyNowSignalInput | null {
  if (!signals?.length) return null;
  if (triggerId) {
    const matched = signals.find((signal) => signal.id === triggerId);
    if (matched) return matched;
  }
  return [...signals].sort((a, b) => {
    const byStrength = (finiteStrength(b.signalStrength) ?? -1) - (finiteStrength(a.signalStrength) ?? -1);
    if (byStrength !== 0) return byStrength;
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  })[0] ?? null;
}

function toSourceView(signal: WhyNowSignalInput): WhyNowSourceView {
  const typeLabel = sourceTypeLabel(signal.sourceType ?? null);
  const name = signal.sourceName?.trim() ? signal.sourceName.trim() : null;
  const url = signal.sourceUrl?.trim() ? signal.sourceUrl.trim() : null;
  return {
    typeLabel,
    name,
    url,
    date: signal.detectedAt ? formatDate(signal.detectedAt) : null,
    missing: !typeLabel && !name && !url,
  };
}

function interpretation(category: string | null, days: number | null): string {
  const current = days != null && days <= 30 ? "aktuelle " : "";
  if (category) {
    return `Das ${current}Signal deutet auf ein konkretes Vorhaben im Bereich ${category} hin.`;
  }
  return "Das Signal deutet auf ein konkretes Vorhaben hin.";
}

export function toWhyNowView(input: {
  signals: WhyNowSignalInput[];
  triggerId?: string | null;
  now?: Date;
}): WhyNowView | null {
  const primary = selectWhyNowSignal(input.signals, input.triggerId);
  if (!primary?.title) return null;

  const days = daysSince(primary.detectedAt, input.now);
  const category = signalTypeHeadline(primary.type);
  const supporting = input.signals
    .filter((signal) => signal.id !== primary.id)
    .map((signal) => {
      const ageDays = daysSince(signal.detectedAt, input.now);
      return {
        id: signal.id,
        title: signal.title,
        category: signalTypeHeadline(signal.type),
        age: ageDays == null ? "—" : recencyLabel(ageDays),
        strength: finiteStrength(signal.signalStrength),
      };
    });

  return {
    category,
    title: primary.title,
    age: days == null ? null : recencyLabel(days),
    strength: finiteStrength(primary.signalStrength),
    source: toSourceView(primary),
    interpretation: interpretation(category, days),
    supporting,
  };
}

export type SignalRowView = {
  id: string;
  name: string;
  age: string;
  strength: number | null;
};

export function toSignalRow(input: {
  id: string;
  type: string;
  title: string;
  detectedAt: Date | string;
  signalStrength?: number | null;
  now?: Date;
}): SignalRowView {
  const days = daysSince(input.detectedAt, input.now);
  return {
    id: input.id,
    name: signalTypeHeadline(input.type) ?? input.title,
    age: days == null ? "—" : formatDays(days),
    strength: finiteStrength(input.signalStrength),
  };
}
