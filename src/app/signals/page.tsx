import Link from "next/link";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { SetupState } from "@/components/ui/SetupState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDatabaseGate } from "@/lib/db/status";
import { listSignals } from "@/lib/db/signals";
import { formatDate, formatEnum } from "@/lib/format";

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
        eyebrow="Intelligence"
        title="Signals"
        description="Publicly observed events scored for sales relevance. No automated crawling in this sprint."
      />
      <DemoBanner seedCount={seedCount} />
      {signals.length === 0 ? (
        <EmptyState title="No signals" description="Create a signal via POST /api/signals." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-canvas-elevated text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Signal</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Detected</th>
                <th className="px-4 py-3 font-medium">Strength</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr key={signal.id} className="border-t border-line hover:bg-canvas-hover">
                  <td className="px-4 py-3 text-ink">
                    {signal.title}
                    {signal.isSeed ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-faint">
                        demo
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/companies/${signal.company.id}`} className="text-ink-muted hover:text-accent">
                      {signal.company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatEnum(signal.type)}</td>
                  <td className="px-4 py-3 font-mono text-ink-muted">{formatDate(signal.detectedAt)}</td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={signal.signalStrength} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={signal.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
