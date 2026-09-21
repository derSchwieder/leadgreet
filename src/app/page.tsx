import { DemoBanner } from "@/components/layout/DemoBanner";
import { CompanyName } from "@/components/ui/CompanyName";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SetupState } from "@/components/ui/SetupState";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { getDashboardData } from "@/lib/db/dashboard";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getDatabaseGate } from "@/lib/db/status";
import { displayStoredText } from "@/lib/display-copy";
import { formatDate, formatDays } from "@/lib/format";
import { SIGNAL_CATEGORY_LABELS_DE } from "@/lib/labels";
import Link from "next/link";
import type { SignalCategory } from "@/types";

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

  const accountId = await getCurrentAccountId();
  const data = await getDashboardData(accountId);
  const seedTotal =
    data.seedCounts.companies +
    data.seedCounts.signals +
    data.seedCounts.contacts +
    data.seedCounts.opportunities;
  const maxCategory = Math.max(1, ...WEEK_CATEGORIES.map((key) => data.signalsThisWeek[key]));

  return (
    <div>
      <PageHeader
        eyebrow="Vertriebsintelligenz"
        title="Übersicht"
        description="Die wichtigsten Signale, Chancen und Ansprechpartner auf einen Blick."
      />
      <DemoBanner seedCount={seedTotal} />

      <section aria-label="Kennzahlen" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Unternehmen" value={data.kpis.companies} />
        <KpiCard label="Neue Signale" value={data.kpis.newSignals} hint="Letzte 7 Tage" emphasis />
        <KpiCard label="Top-Chancen" value={data.kpis.hotOpportunities} hint="Bewertung ≥ 70" emphasis />
        <KpiCard label="Relevante Kontakte" value={data.kpis.newContacts} hint="Letzte 7 Tage" />
      </section>

      <section className="mt-10">
        <SectionHeading hint="Bewertung ≥ 70">Top-Chancen</SectionHeading>
        {data.hotOpportunities.length === 0 ? (
          <EmptyState
            title="Noch keine Top-Chancen"
            description="Chancen mit einer Bewertung von 70 oder höher erscheinen hier."
          />
        ) : (
          <div className="grid gap-4">
            {data.hotOpportunities.map((row) => (
              <article key={row.id} className="surface-featured p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-3">
                    <CompanyName id={row.company.id} name={row.company.name} />
                    {row.primarySignal ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <SignalTypeBadge type={row.primarySignal.type} />
                        <span className="text-xs text-ink-faint">
                          Signal-Alter {formatDays(row.signalAgeDays)}
                        </span>
                      </div>
                    ) : null}
                    <p className="max-w-3xl text-sm leading-6 text-ink-muted">
                      {displayStoredText(row.recommendedApproach, "Noch kein Gesprächseinstieg hinterlegt.")}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Ansprechpartner:{" "}
                      <span className="text-ink-muted">{row.contact ? row.contact.fullName : "—"}</span>
                    </p>
                  </div>
                  <Link href={`/opportunities/${row.id}`} className="shrink-0 text-right">
                    <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">Bewertung</p>
                    <ScoreBadge score={row.opportunityScore} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHeading>Signale in dieser Woche</SectionHeading>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {WEEK_CATEGORIES.map((key) => {
            const count = data.signalsThisWeek[key];
            const width = `${Math.round((count / maxCategory) * 100)}%`;
            return (
              <article key={key} className="surface p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-ink">{SIGNAL_CATEGORY_LABELS_DE[key]}</p>
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

      <section className="mt-10">
        <SectionHeading>Neue Signale</SectionHeading>
        {data.recentSignals.length === 0 ? (
          <EmptyState
            title="Noch keine Signale"
            description="Eingehende öffentliche Signale werden hier aufgeführt."
          />
        ) : (
          <ul className="list-shell">
            {data.recentSignals.map((signal) => (
              <li key={signal.id} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SignalTypeBadge type={signal.type} />
                    {signal.isSeed ? <DemoBadge /> : null}
                  </div>
                  <p className="truncate text-sm text-ink">{signal.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <CompanyName id={signal.company.id} name={signal.company.name} size="xs" muted />
                    <span className="text-ink-faint">·</span>
                    <span>{formatDate(signal.detectedAt)}</span>
                  </div>
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
