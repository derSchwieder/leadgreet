import { DemoBanner } from "@/components/layout/DemoBanner";
import { OpportunitiesDirectory } from "@/components/opportunities/OpportunitiesDirectory";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getDatabaseGate } from "@/lib/db/status";
import { listOpportunities } from "@/lib/db/opportunities";

export default async function OpportunitiesPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const accountId = await getCurrentAccountId();
  const opportunities = await listOpportunities(accountId);
  const seedCount = opportunities.filter((item) => item.isSeed).length;

  return (
    <div>
      <PageHeader
        eyebrow="Vertrieb"
        title="Chancen"
        description="Konkrete Vertriebsanlässe aus Signal, Unternehmens-Fit und passendem Ansprechpartner."
      />
      <DemoBanner seedCount={seedCount} />
      {opportunities.length === 0 ? (
        <EmptyState
          title="Noch keine Chancen"
          description="Bewertete Vertriebsanlässe erscheinen hier, sobald Signale und Kontakte zusammengeführt wurden."
        />
      ) : (
        <OpportunitiesDirectory
          opportunities={opportunities.map((opportunity) => ({
            id: opportunity.id,
            title: opportunity.title,
            isSeed: opportunity.isSeed,
            whyNow: opportunity.whyNow,
            recommendedApproach: opportunity.recommendedApproach,
            opportunityScore: opportunity.opportunityScore,
            status: opportunity.status,
            company: { id: opportunity.company.id, name: opportunity.company.name },
            recommendedContact: opportunity.recommendedContact
              ? {
                  fullName: opportunity.recommendedContact.fullName,
                  role: opportunity.recommendedContact.role,
                }
              : null,
            signals: opportunity.signals.map((signal) => ({
              type: signal.type,
              detectedAt: signal.detectedAt,
            })),
          }))}
        />
      )}
    </div>
  );
}

