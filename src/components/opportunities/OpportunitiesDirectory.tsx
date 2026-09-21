"use client";

import { useMemo, useState } from "react";
import {
  OpportunityListCard,
  type OpportunityListCardData,
} from "@/components/opportunities/OpportunityListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntitySearchField } from "@/components/ui/EntitySearchField";
import { filterOpportunitiesBySearch } from "@/lib/search/entity-search";

export function OpportunitiesDirectory({
  opportunities,
}: {
  opportunities: OpportunityListCardData[];
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(
    () => filterOpportunitiesBySearch(opportunities, query),
    [opportunities, query],
  );
  const searching = query.trim().length > 0;

  return (
    <div>
      <div className="mb-4">
        <EntitySearchField
          value={query}
          onChange={setQuery}
          placeholder="Unternehmen oder Opportunity suchen …"
          label="Unternehmen oder Opportunity suchen"
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
          description="Keine Chance passt zu dieser Suche. Suche leeren, um die volle Liste zu sehen."
        />
      ) : (
        <ul className="grid gap-4">
          {matches.map((opportunity) => (
            <OpportunityListCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </ul>
      )}
    </div>
  );
}
