"use client";

import { useMemo, useState } from "react";
import { CompanyName } from "@/components/ui/CompanyName";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntitySearchField } from "@/components/ui/EntitySearchField";
import { filterByNameOrCity } from "@/lib/search/entity-search";
import { display, displayIndustry, displayLocation, formatEnum } from "@/lib/format";
import type { CompanySize } from "@/types";

export type CompanyDirectoryRow = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  employees: number | null;
  companySize: CompanySize | null;
  isSeed: boolean;
};

export function CompaniesDirectory({ companies }: { companies: CompanyDirectoryRow[] }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => filterByNameOrCity(companies, query), [companies, query]);
  const searching = query.trim().length > 0;

  return (
    <div>
      <div className="mb-4">
        <EntitySearchField
          value={query}
          onChange={setQuery}
          placeholder="Unternehmen suchen …"
          label="Unternehmen suchen"
        />
        {searching ? (
          <p className="mt-2 text-xs text-ink-muted">
            {matches.length === 0
              ? "Keine Treffer"
              : matches.length === 1
                ? "1 Treffer"
                : `${matches.length} Treffer`}
          </p>
        ) : null}
      </div>
      {matches.length === 0 ? (
        <EmptyState
          title="Keine Treffer"
          description="Kein Unternehmen passt zu dieser Suche. Suche leeren, um die volle Liste zu sehen."
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
              {matches.map((company) => (
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
