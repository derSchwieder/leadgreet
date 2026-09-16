import Link from "next/link";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { SetupState } from "@/components/ui/SetupState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDatabaseGate } from "@/lib/db/status";
import { listOpportunities } from "@/lib/db/opportunities";

export default async function OpportunitiesPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const opportunities = await listOpportunities();
  const seedCount = opportunities.filter((item) => item.isSeed).length;

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline"
        title="Opportunities"
        description="Scored sales opportunities generated from signals, company fit, and contacts."
      />
      <DemoBanner seedCount={seedCount} />
      {opportunities.length === 0 ? (
        <EmptyState
          title="No opportunities"
          description="Create an opportunity via POST /api/opportunities."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-canvas-elevated text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Opportunity</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className="border-t border-line hover:bg-canvas-hover">
                  <td className="px-4 py-3">
                    <Link href={`/opportunities/${opportunity.id}`} className="text-ink hover:text-accent">
                      {opportunity.title}
                    </Link>
                    {opportunity.isSeed ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-faint">
                        demo
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${opportunity.company.id}`}
                      className="text-ink-muted hover:text-accent"
                    >
                      {opportunity.company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={opportunity.opportunityScore} />
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {opportunity.recommendedContact?.fullName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={opportunity.status} />
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
