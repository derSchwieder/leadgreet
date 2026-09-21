import { DemoBanner } from "@/components/layout/DemoBanner";
import { CompanyName } from "@/components/ui/CompanyName";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { listCompanies } from "@/lib/db/companies";
import { getDatabaseGate } from "@/lib/db/status";
import { display, displayIndustry, displayLocation, formatEnum } from "@/lib/format";

export default async function CompaniesPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const companies = await listCompanies();
  const seedCount = companies.filter((company) => company.isSeed).length;

  return (
    <div>
      <PageHeader
        eyebrow="Bestand"
        title="Unternehmen"
        description="Unternehmen auf dem Radar. Profildaten bleiben leer, bis sie aus öffentlichen Quellen angereichert werden."
      />
      <DemoBanner seedCount={seedCount} />
      {companies.length === 0 ? (
        <EmptyState
          title="Noch keine Unternehmen"
          description="Sobald Unternehmen erfasst sind, erscheinen sie in dieser Liste."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Unternehmen</th>
                <th>Branche</th>
                <th>Standort</th>
                <th>Mitarbeitende</th>
                <th>Größe</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <span className="inline-flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-2">
                        <CompanyName id={company.id} name={company.name} />
                        {company.isSeed ? <DemoBadge /> : null}
                      </span>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-inline w-fit text-[11px]"
                        >
                          Webseite ↗
                        </a>
                      ) : null}
                    </span>
                  </td>
                  <td className="text-ink-muted">{displayIndustry(company.industry)}</td>
                  <td className="text-ink-muted">
                    {displayLocation(company.city, company.country)}
                  </td>
                  <td className="font-mono tabular text-ink-muted">{display(company.employees)}</td>
                  <td className="text-ink-muted">{formatEnum(company.companySize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
