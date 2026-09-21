import { DemoBanner } from "@/components/layout/DemoBanner";
import { CompaniesDirectory } from "@/components/companies/CompaniesDirectory";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { listCompanies } from "@/lib/db/companies";
import { getDatabaseGate } from "@/lib/db/status";

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
        <CompaniesDirectory
          companies={companies.map((company) => ({
            id: company.id,
            name: company.name,
            website: company.website,
            industry: company.industry,
            city: company.city,
            country: company.country,
            employees: company.employees,
            companySize: company.companySize,
            isSeed: company.isSeed,
          }))}
        />
      )}
    </div>
  );
}
