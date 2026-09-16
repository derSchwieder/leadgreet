import Link from "next/link";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { SetupState } from "@/components/ui/SetupState";
import { getDashboardData } from "@/lib/db/dashboard";
import { getDatabaseGate } from "@/lib/db/status";
import { formatDate, formatDays, formatEnum } from "@/lib/format";
import { SIGNAL_CATEGORY_LABELS, type SignalCategory } from "@/types";

const WEEK_CATEGORIES: SignalCategory[] = [
  "AI",
  "CLOUD",
  "DATA",
  "AUTOMATION",
  "IT_TRANSFORMATION",
  "LEADERSHIP",
  "INVESTMENT",
];

export default async function DashboardPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const data = await getDashboardData();
  const seedTotal =
    data.seedCounts.companies +
    data.seedCounts.signals +
    data.seedCounts.contacts +
    data.seedCounts.opportunities;
  const maxCategory = Math.max(1, ...WEEK_CATEGORIES.map((key) => data.signalsThisWeek[key]));

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Current public signals, scored opportunities, and the contacts to start with."
      />
      <DemoBanner seedCount={seedTotal} />

      <section aria-label="Key metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Companies" value={data.kpis.companies} />
        <KpiCard label="New Signals" value={data.kpis.newSignals} hint="Last 7 days" />
        <KpiCard label="Hot Opportunities" value={data.kpis.hotOpportunities} hint="Score ≥ 70" />
        <KpiCard label="New Contacts" value={data.kpis.newContacts} hint="Last 7 days" />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          Hot Opportunities
        </h2>
        {data.hotOpportunities.length === 0 ? (
          <EmptyState
            title="No hot opportunities yet"
            description="Opportunities with a score of 70 or higher will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-canvas-elevated text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Signal</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Signal Age</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Recommended Approach</th>
                </tr>
              </thead>
              <tbody>
                {data.hotOpportunities.map((row) => (
                  <tr key={row.id} className="border-t border-line hover:bg-canvas-hover">
                    <td className="px-4 py-3">
                      <Link href={`/companies/${row.company.id}`} className="text-ink hover:text-accent">
                        {row.company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {row.primarySignal ? (
                        <span>
                          {formatEnum(row.primarySignal.type)}
                          <span className="mt-0.5 block text-xs text-ink-faint">
                            {row.primarySignal.title}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/opportunities/${row.id}`}>
                        <ScoreBadge score={row.opportunityScore} />
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-muted tabular">
                      {formatDays(row.signalAgeDays)}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {row.contact ? row.contact.fullName : "—"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-ink-muted">
                      <p className="line-clamp-2">{row.recommendedApproach ?? "—"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          Signals this week
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {WEEK_CATEGORIES.map((key) => {
            const count = data.signalsThisWeek[key];
            const width = `${Math.round((count / maxCategory) * 100)}%`;
            return (
              <article key={key} className="rounded-lg border border-line bg-canvas-card p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-ink">{SIGNAL_CATEGORY_LABELS[key]}</p>
                  <p className="font-mono tabular text-ink">{count}</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-canvas-hover">
                  <div className="h-full rounded-full bg-accent" style={{ width }} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          Recent Signals
        </h2>
        {data.recentSignals.length === 0 ? (
          <EmptyState
            title="No signals yet"
            description="Incoming public signals will be listed here."
          />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {data.recentSignals.map((signal) => (
              <li key={signal.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{signal.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    <Link href={`/companies/${signal.company.id}`} className="hover:text-accent">
                      {signal.company.name}
                    </Link>
                    <span className="mx-2 text-ink-faint">·</span>
                    {formatEnum(signal.type)}
                    <span className="mx-2 text-ink-faint">·</span>
                    {formatDate(signal.detectedAt)}
                    {signal.isSeed ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-faint">
                        demo
                      </span>
                    ) : null}
                  </p>
                </div>
                <ScoreBadge score={signal.signalStrength} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
