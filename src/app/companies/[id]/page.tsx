import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ScoreBreakdownBars } from "@/components/ui/ScoreBreakdownBars";
import { SetupState } from "@/components/ui/SetupState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCompanyById } from "@/lib/db/companies";
import { getDatabaseGate } from "@/lib/db/status";
import { listContacts } from "@/lib/db/contacts";
import { listOpportunities } from "@/lib/db/opportunities";
import { listSignals } from "@/lib/db/signals";
import { NotFoundError } from "@/lib/db/serialize";
import { display, formatDate, formatEnum } from "@/lib/format";

export default async function CompanyDetailPage({
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
    const [company, signals, contacts, allOpportunities] = await Promise.all([
      getCompanyById(id),
      listSignals({ companyId: id }),
      listContacts({ companyId: id }),
      listOpportunities(),
    ]);
    const opportunities = allOpportunities.filter((item) => item.companyId === id);
    const hottest = opportunities[0] ?? null;
    const location = [company.city, company.region, company.country].filter(Boolean).join(", ");

    return (
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          <Link href="/companies" className="hover:text-accent">
            Companies
          </Link>
        </p>
        <header className="mb-8 border-b border-line pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {company.name}
                {company.isSeed ? (
                  <span className="ml-3 text-xs font-normal uppercase tracking-wide text-ink-faint">
                    demo
                  </span>
                ) : null}
              </h1>
              {company.legalName ? (
                <p className="mt-1 text-sm text-ink-muted">{company.legalName}</p>
              ) : null}
            </div>
            {hottest ? (
              <Link href={`/opportunities/${hottest.id}`} className="text-right">
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint">Score</p>
                <ScoreBadge score={hottest.opportunityScore} />
              </Link>
            ) : null}
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Fact label="Industry" value={display(company.industry)} />
            <Fact label="Location" value={location || "—"} />
            <Fact label="Employees" value={display(company.employees)} />
            <Fact
              label="Revenue"
              value={
                company.revenue
                  ? `${company.revenue} ${company.revenueCurrency ?? ""} ${company.revenueYear ?? ""}`.trim()
                  : "—"
              }
            />
            <Fact label="Company size" value={display(company.companySize)} />
          </dl>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">Why now?</h2>
          <div className="rounded-lg border border-line bg-canvas-card p-4 text-sm leading-6 text-ink-muted">
            {hottest?.whyNow ??
              "No opportunity scored yet. Add a signal to generate a why-now narrative."}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            Current Signals
          </h2>
          {signals.length === 0 ? (
            <EmptyState title="No signals" description="No public signals are attached to this account." />
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {signals.map((signal) => (
                <li key={signal.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm text-ink">{signal.title}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatEnum(signal.type)} · {formatDate(signal.detectedAt)}
                    </p>
                  </div>
                  <ScoreBadge score={signal.signalStrength} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            Signal Timeline
          </h2>
          {signals.length === 0 ? (
            <EmptyState title="Empty timeline" description="Signals will appear here in chronological order." />
          ) : (
            <ol className="relative ml-3 border-l border-line">
              {[...signals]
                .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
                .map((signal) => (
                  <li key={signal.id} className="mb-5 ml-5">
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-line bg-accent" />
                    <p className="font-mono text-xs text-ink-faint">{formatDate(signal.detectedAt)}</p>
                    <p className="mt-1 text-sm text-ink">{signal.title}</p>
                    <p className="text-xs text-ink-muted">{formatEnum(signal.type)}</p>
                  </li>
                ))}
            </ol>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">Contacts</h2>
          {contacts.length === 0 ? (
            <EmptyState title="No contacts" description="Decision makers will be listed here once identified." />
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {contacts.map((contact) => (
                <li key={contact.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-ink">{contact.fullName}</span>
                  <span className="text-ink-muted">
                    {formatEnum(contact.role)}
                    {contact.isDecisionMaker ? " · decision maker" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">
            Opportunities
          </h2>
          {opportunities.length === 0 ? (
            <EmptyState
              title="No opportunities"
              description="Scored opportunities for this account will appear here."
            />
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {opportunities.map((opportunity) => (
                <li key={opportunity.id} className="flex items-center justify-between px-4 py-3">
                  <Link href={`/opportunities/${opportunity.id}`} className="text-sm text-ink hover:text-accent">
                    {opportunity.title}
                  </Link>
                  <div className="flex items-center gap-3">
                    <StatusBadge value={opportunity.status} />
                    <ScoreBadge score={opportunity.opportunityScore} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint">Score</h2>
          {hottest ? (
            <div className="rounded-lg border border-line bg-canvas-card p-4">
              <div className="mb-4 flex items-baseline justify-between">
                <p className="text-sm text-ink-muted">Leading opportunity</p>
                <p className="font-mono text-2xl tabular text-accent">{hottest.opportunityScore}</p>
              </div>
              <ScoreBreakdownBars
                scores={{
                  signalStrength: hottest.signalStrength,
                  freshness: hottest.freshness,
                  companyFit: hottest.companyFit,
                  contactFit: hottest.contactFit,
                  confidence: hottest.confidence,
                }}
              />
            </div>
          ) : (
            <EmptyState title="No score yet" description="Scores appear after an opportunity is generated." />
          )}
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
