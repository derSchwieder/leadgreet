"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

export const OPPORTUNITY_TABS = [
  { id: "uebersicht", label: "Übersicht" },
  { id: "greetelligence", label: "Greetelligence" },
  { id: "aktivitaeten", label: "Aktivitäten" },
  { id: "kontakte", label: "Kontakte" },
] as const;

export type OpportunityTabId = (typeof OPPORTUNITY_TABS)[number]["id"];

function tabFromHash(hash: string): OpportunityTabId {
  const value = hash.replace(/^#/, "").toLowerCase();
  if (value === "greetelligence") return "greetelligence";
  if (value === "aktivitaeten" || value === "aktivitäten" || value === "verlauf") {
    return "aktivitaeten";
  }
  if (value === "kontakte" || value === "empfohlener-kontakt") return "kontakte";
  return "uebersicht";
}

export function OpportunityTabs({
  overview,
  greetelligence,
  activities,
  contacts,
}: {
  overview: ReactNode;
  greetelligence: ReactNode;
  activities: ReactNode;
  contacts: ReactNode;
}) {
  const baseId = useId();
  const [tab, setTab] = useState<OpportunityTabId>("uebersicht");

  useEffect(() => {
    function syncFromHash() {
      setTab(tabFromHash(window.location.hash));
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function selectTab(next: OpportunityTabId) {
    setTab(next);
    const nextHash = next === "uebersicht" ? "" : `#${next}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", `${window.location.pathname}${nextHash}`);
    }
  }

  const panels: Record<OpportunityTabId, ReactNode> = {
    uebersicht: overview,
    greetelligence,
    aktivitaeten: activities,
    kontakte: contacts,
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div
          role="tablist"
          aria-label="Opportunity-Bereiche"
          className="flex min-w-0 flex-wrap gap-1 border-b border-line"
        >
          {OPPORTUNITY_TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${baseId}-${item.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${item.id}`}
                className={`relative whitespace-nowrap px-3 py-2.5 text-sm transition ${
                  selected
                    ? "font-medium text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-accent"
                    : "text-ink-muted hover:text-ink"
                }`}
                onClick={() => selectTab(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {OPPORTUNITY_TABS.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-${item.id}`}
          hidden={tab !== item.id}
          className="pt-6"
        >
          {panels[item.id]}
        </div>
      ))}
    </div>
  );
}
