import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCrmButton } from "@/components/opportunities/AddToCrmButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScoreBreakdownBars } from "@/components/ui/ScoreBreakdownBars";
import { SetupState } from "@/components/ui/SetupState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDatabaseGate } from "@/lib/db/status";
import { getOpportunityById } from "@/lib/db/opportunities";
import { NotFoundError } from "@/lib/db/serialize";
import { formatDate, formatEnum } from "@/lib/format";
import { SCORING_WEIGHTS } from "@/lib/scoring";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const { id } = await params;

  try {
    const opportunity = await getOpportunityById(id);

    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          <Link href="/opportunities" className="hover:text-accent">
            Opportunities
          </Link>
        </p>
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{opportunity.title}</h1>
            <p className="mt-2 text-sm text-ink-muted">
              <Link href={`/companies/${opportunity.company.id}`} className="hover:text-accent">
                {opportunity.company.name}
              </Link>
              {opportunity.isSeed ? (
                <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-faint">demo</span>
              ) : null}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint">Opportunity Score</p>
            <p className="font-mono text-4xl tabular text-accent">{opportunity.opportunityScore}</p>
            <div className="mt-2">
              <StatusBadge value={opportunity.status} />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <section className="rounded-lg border border-line bg-canvas-card p-4">
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">Why now?</h2>
              <p className="text-sm leading-6 text-ink-muted">{opportunity.whyNow ?? "—"}</p>
            </section>
            <section className="rounded-lg border border-line bg-canvas-card p-4">
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Recommended approach
              </h2>
              <p className="text-sm leading-6 text-ink-muted">
                {opportunity.recommendedApproach ?? "—"}
              </p>
            </section>
            <section>
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Relevant signals
              </h2>
              {opportunity.signals.length === 0 ? (
                <EmptyState title="No linked signals" description="This opportunity has no attached signals." />
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {opportunity.signals.map((signal) => (
                    <li key={signal.id} className="px-4 py-3">
                      <p className="text-sm text-ink">{signal.title}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {formatEnum(signal.type)} · {formatDate(signal.detectedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Source evidence
              </h2>
              {opportunity.signals.some((signal) => signal.sourceName || signal.sourceUrl) ? (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {opportunity.signals.map((signal) => (
                    <li key={signal.id} className="px-4 py-3 text-sm text-ink-muted">
                      {signal.sourceName ?? "Unnamed source"}
                      {signal.sourceUrl ? (
                        <a
                          href={signal.sourceUrl}
                          className="ml-2 text-accent hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="ml-2 text-ink-faint">No URL on file</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No source evidence"
                  description="Attach a source URL when ingesting signals to show evidence here."
                />
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-2">
            <section className="rounded-lg border border-line bg-canvas-card p-4">
              <h2 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Score Breakdown
              </h2>
              <ScoreBreakdownBars
                scores={{
                  signalStrength: opportunity.signalStrength,
                  freshness: opportunity.freshness,
                  companyFit: opportunity.companyFit,
                  contactFit: opportunity.contactFit,
                  confidence: opportunity.confidence,
                }}
              />
              <p className="mt-4 text-xs text-ink-faint">
                Weights: Strength {SCORING_WEIGHTS.signalStrength}, Freshness {SCORING_WEIGHTS.freshness},
                Fit {SCORING_WEIGHTS.companyFit}, Contact {SCORING_WEIGHTS.contactFit}, Confidence{" "}
                {SCORING_WEIGHTS.confidence}.
              </p>
            </section>
            <section className="rounded-lg border border-line bg-canvas-card p-4">
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Recommended contact
              </h2>
              {opportunity.recommendedContact ? (
                <p className="text-sm text-ink">
                  {opportunity.recommendedContact.fullName}
                  <span className="mt-1 block text-ink-muted">
                    {formatEnum(opportunity.recommendedContact.role)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-ink-muted">No contact identified.</p>
              )}
            </section>
            <section className="rounded-lg border border-line bg-canvas-card p-4">
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">CRM</h2>
              <AddToCrmButton opportunityId={opportunity.id} />
            </section>
            {opportunity.scoreBreakdown ? (
              <section className="rounded-lg border border-line bg-canvas-card p-4">
                <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                  Full explanation
                </h2>
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-ink-muted">
                  {opportunity.scoreBreakdown.explanation}
                </pre>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}
