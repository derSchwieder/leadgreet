import { DemoBanner } from "@/components/layout/DemoBanner";
import { CompanyName } from "@/components/ui/CompanyName";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { SetupState } from "@/components/ui/SetupState";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDatabaseGate } from "@/lib/db/status";
import { listSignals } from "@/lib/db/signals";
import { formatDate } from "@/lib/format";

export default async function SignalsPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const signals = await listSignals();
  const seedCount = signals.filter((signal) => signal.isSeed).length;

  return (
    <div>
      <PageHeader
        eyebrow="Beobachtung"
        title="Signale"
        description="Öffentlich beobachtete Ereignisse, bewertet nach Vertriebsrelevanz. Signaltyp, Aktualität und betroffene Firma sind getrennt lesbar."
      />
      <DemoBanner seedCount={seedCount} />
      {signals.length === 0 ? (
        <EmptyState
          title="Noch keine Signale"
          description="Sobald öffentliche Signale erfasst sind, erscheinen sie in dieser Liste."
        />
      ) : (
        <ul className="grid gap-4">
          {signals.map((signal) => (
            <li key={signal.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <SignalTypeBadge type={signal.type} />
                    <StatusBadge value={signal.status} />
                    {signal.isSeed ? <DemoBadge /> : null}
                  </div>
                  <p className="text-sm font-medium text-ink">{signal.title}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                    <CompanyName id={signal.company.id} name={signal.company.name} size="xs" muted />
                    <span className="text-ink-faint">Aktualität {formatDate(signal.detectedAt)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                    Signalstärke
                  </p>
                  <ScoreBadge score={signal.signalStrength} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
