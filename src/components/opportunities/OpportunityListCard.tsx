import Link from "next/link";
import { CompanyName } from "@/components/ui/CompanyName";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { displayOpportunityTitle, displayStoredText } from "@/lib/display-copy";
import { formatEnum } from "@/lib/format";
import { opportunityDetailPath } from "@/lib/opportunities/path";

export type OpportunityListCardData = {
  id: string;
  title: string;
  isSeed: boolean;
  whyNow: string | null;
  recommendedApproach: string | null;
  opportunityScore: number;
  status: string;
  company: { id: string; name: string };
  recommendedContact: { fullName: string; role: string } | null;
  signals: Array<{ type: string; detectedAt: Date | string }>;
};

export function OpportunityListCard({ opportunity }: { opportunity: OpportunityListCardData }) {
  const href = opportunityDetailPath(opportunity.id);
  const primarySignal = [...opportunity.signals].sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
  )[0];

  return (
    <li>
      <Link
        href={href}
        className="surface-featured block p-5 transition hover:border-accent/50"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CompanyName id={opportunity.company.id} name={opportunity.company.name} href={null} />
              {opportunity.isSeed ? <DemoBadge /> : null}
            </div>
            <p className="text-base font-semibold tracking-tight text-ink">
              {displayOpportunityTitle(opportunity.title)}
            </p>
            {primarySignal ? <SignalTypeBadge type={primarySignal.type} /> : null}
            <p className="max-w-3xl text-sm leading-6 text-ink-muted">
              {displayStoredText(opportunity.whyNow, "Noch keine Begründung vorhanden.")}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-faint">
              <p>
                Ansprechpartner:{" "}
                <span className="text-ink-muted">
                  {opportunity.recommendedContact
                    ? `${opportunity.recommendedContact.fullName} · ${formatEnum(opportunity.recommendedContact.role)}`
                    : "—"}
                </span>
              </p>
              <p>
                Gesprächseinstieg:{" "}
                <span className="text-ink-muted">
                  {displayStoredText(opportunity.recommendedApproach)}
                </span>
              </p>
            </div>
          </div>
          <div className="shrink-0 space-y-3 text-right">
            <ScoreBadge score={opportunity.opportunityScore} />
            <div>
              <StatusBadge value={opportunity.status} />
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
