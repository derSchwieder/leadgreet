import Link from "next/link";
import { notFound } from "next/navigation";
import { SalesIntelligencePanel } from "@/components/intelligence/SalesIntelligencePanel";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GreetChanceScores } from "@/components/ui/GreetChanceScores";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { ScoreBreakdownBars } from "@/components/ui/ScoreBreakdownBars";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SetupState } from "@/components/ui/SetupState";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCompanyById } from "@/lib/db/companies";
import { getCompanyGreet } from "@/lib/db/company-greet";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getCompanyIntelligence } from "@/lib/db/intelligence";
import { getDatabaseGate } from "@/lib/db/status";
import { listContacts } from "@/lib/db/contacts";
import { listOpportunities } from "@/lib/db/opportunities";
import { listSignals } from "@/lib/db/signals";
import { NotFoundError } from "@/lib/db/serialize";
import { display, displayIndustry, displayLocation, formatDate, formatEnum } from "@/lib/format";
import { displayOpportunityTitle, displayStoredText } from "@/lib/display-copy";

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
    const accountId = await getCurrentAccountId();
    const [company, signals, contacts, allOpportunities, companyGreet] = await Promise.all([
      getCompanyById(id),
      listSignals({ companyId: id }),
      listContacts({ companyId: id }),
      listOpportunities(accountId),
      getCompanyGreet(id),
    ]);
    const intelligence = await getCompanyIntelligence(id, accountId);
    const opportunities = allOpportunities.filter((item) => item.companyId === id);
    const location = displayLocation(company.city, company.country, company.region);

    return (
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          <Link href="/companies" className="hover:text-accent">
            Unternehmen
          </Link>
        </p>
        <header className="mb-8 border-b border-line pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <CompanyLogo name={company.name} size="md" />
              <div>
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-ink">
                  {company.name}
                  {company.isSeed ? <DemoBadge /> : null}
                </h1>
                {company.legalName ? (
                  <p className="mt-1 text-sm text-ink-muted">{company.legalName}</p>
                ) : null}
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-inline mt-2 inline-block text-sm"
                  >
                    Webseite ↗
                  </a>
                ) : null}
              </div>
            </div>
            <GreetChanceScores greet={companyGreet.opportunityScore} />
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Fact label="Branche" value={displayIndustry(company.industry)} />
            <Fact label="Standort" value={location || "—"} />
            <Fact label="Mitarbeitende" value={display(company.employees)} />
            <Fact
              label="Umsatz"
              value={
                company.revenue
                  ? `${company.revenue} ${company.revenueCurrency ?? ""} ${company.revenueYear ?? ""}`.trim()
                  : "—"
              }
            />
            <Fact label="Unternehmensgröße" value={formatEnum(company.companySize)} />
          </dl>
        </header>

        <SalesIntelligencePanel intelligence={intelligence} />

        <section className="mb-8">
          <SectionHeading>Warum jetzt?</SectionHeading>
          <div className="surface p-5 text-sm leading-6 text-ink-muted">
            {displayStoredText(
              companyGreet.whyNow,
              "Sobald ein öffentliches Signal vorliegt, erscheint hier die Begründung.",
            )}
          </div>
        </section>

        <section className="mb-8">
          <SectionHeading>Aktuelle Signale</SectionHeading>
          {signals.length === 0 ? (
            <EmptyState
              title="Keine Signale"
              description="Diesem Unternehmen sind noch keine öffentlichen Signale zugeordnet."
            />
          ) : (
            <ul className="list-shell">
              {signals.map((signal) => (
                <li key={signal.id} className="flex items-start justify-between gap-4 px-4 py-4">
                  <div className="space-y-2">
                    <SignalTypeBadge type={signal.type} />
                    <p className="text-sm text-ink">{signal.title}</p>
                    <p className="text-xs text-ink-muted">{formatDate(signal.detectedAt)}</p>
                  </div>
                  <ScoreBadge score={signal.signalStrength} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          <SectionHeading>Signal-Verlauf</SectionHeading>
          {signals.length === 0 ? (
            <EmptyState
              title="Leerer Verlauf"
              description="Signale erscheinen hier in chronologischer Reihenfolge."
            />
          ) : (
            <ol className="relative ml-3 border-l border-line">
              {[...signals]
                .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
                .map((signal) => (
                  <li key={signal.id} className="mb-6 ml-5">
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-line bg-accent" />
                    <p className="font-mono text-xs text-ink-faint">{formatDate(signal.detectedAt)}</p>
                    <p className="mt-1 text-sm text-ink">{signal.title}</p>
                    <div className="mt-2">
                      <SignalTypeBadge type={signal.type} />
                    </div>
                  </li>
                ))}
            </ol>
          )}
        </section>

        <section className="mb-8">
          <SectionHeading>Kontakte</SectionHeading>
          {contacts.length === 0 ? (
            <EmptyState
              title="Keine Kontakte"
              description="Entscheiderinnen und Entscheider erscheinen hier, sobald sie identifiziert sind."
            />
          ) : (
            <ul className="list-shell">
              {contacts.map((contact) => (
                <li key={contact.id} className="flex items-center justify-between px-4 py-3.5 text-sm">
                  <span className="text-ink">{contact.fullName}</span>
                  <span className="text-ink-muted">
                    {formatEnum(contact.role)}
                    {contact.isDecisionMaker ? " · Entscheider" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8">
          <SectionHeading>Chancen</SectionHeading>
          {opportunities.length === 0 ? (
            <EmptyState
              title="Keine Chancen"
              description="Bewertete Vertriebsanlässe für dieses Unternehmen erscheinen hier."
            />
          ) : (
            <ul className="list-shell">
              {opportunities.map((opportunity) => (
                <li key={opportunity.id} className="flex items-center justify-between px-4 py-3.5">
                  <Link
                    href={`/opportunities/${opportunity.id}`}
                    className="text-sm text-ink hover:text-accent"
                  >
                    {displayOpportunityTitle(opportunity.title)}
                  </Link>
                  <div className="flex items-center gap-3">
                    <StatusBadge value={opportunity.status} />
                    <span className="text-right">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                        Chance
                      </span>
                      <ScoreBadge score={opportunity.opportunityScore} label="Chance" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionHeading>Greet</SectionHeading>
          <div className="surface p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <p className="text-sm text-ink-muted">aktuelle Vertriebsrelevanz</p>
              <p className="font-mono text-2xl tabular text-accent">{companyGreet.opportunityScore}</p>
            </div>
            <ScoreBreakdownBars
              scores={{
                signalStrength: companyGreet.signalStrength,
                freshness: companyGreet.freshness,
                companyFit: companyGreet.companyFit,
                contactFit: companyGreet.contactFit,
                confidence: companyGreet.confidence,
              }}
            />
          </div>
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
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
