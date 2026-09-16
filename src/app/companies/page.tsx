import Link from "next/link";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { listCompanies } from "@/lib/db/companies";
import { getDatabaseGate } from "@/lib/db/status";
import { display } from "@/lib/format";

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
        eyebrow="Accounts"
        title="Companies"
        description="Accounts on the radar. Profile fields stay empty until they are enriched from public sources."
      />
      <DemoBanner seedCount={seedCount} />
      {companies.length === 0 ? (
        <EmptyState
          title="No companies"
          description="Add a company via POST /api/companies or run the seed script."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-canvas-elevated text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Industry</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Employees</th>
                <th className="px-4 py-3 font-medium">Size</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-t border-line hover:bg-canvas-hover">
                  <td className="px-4 py-3">
                    <Link href={`/companies/${company.id}`} className="text-ink hover:text-accent">
                      {company.name}
                    </Link>
                    {company.isSeed ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-faint">
                        demo
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{display(company.industry)}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {[company.city, company.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono tabular text-ink-muted">
                    {display(company.employees)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{display(company.companySize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
