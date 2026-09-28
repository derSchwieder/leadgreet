"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntitySearchField } from "@/components/ui/EntitySearchField";
import type { UnresolvedSignalStatus } from "@/types";
import { DiscoveryCard } from "./DiscoveryCard";
import { DiscoveryDetail } from "./DiscoveryDetail";
import {
  dismissDiscoveryItem,
  fetchDiscoveryCompanies,
  fetchDiscoveryItem,
  fetchDiscoveryList,
  resolveDiscoveryItem,
  reviewDiscoveryItem,
  type DiscoveryCompanyOption,
} from "./discovery-api";
import {
  DISCOVERY_STATUS_FILTERS,
  DISCOVERY_STATUS_LABELS,
  availableSignalTypes,
  discoverySignalTypeLabel,
  filterDiscoveryItems,
  keepIfStatus,
  websiteFromDomain,
  type DiscoveryViewItem,
} from "./discovery-presentation";

export function DiscoveryInbox({
  initialItems,
  initialReviewedCount,
  availableTypes,
}: {
  initialItems: DiscoveryViewItem[];
  initialReviewedCount: number;
  availableTypes: string[];
}) {
  const [status, setStatus] = useState<UnresolvedSignalStatus>("NEW");
  const [signalType, setSignalType] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(initialItems);
  const [newCount, setNewCount] = useState(initialItems.length);
  const [reviewedCount, setReviewedCount] = useState(initialReviewedCount);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DiscoveryViewItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyQuery, setCompanyQuery] = useState("");
  const [companies, setCompanies] = useState<DiscoveryCompanyOption[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<DiscoveryCompanyOption | null>(null);
  const [createName, setCreateName] = useState("");
  const [createDomain, setCreateDomain] = useState("");
  const [dismissConfirm, setDismissConfirm] = useState(false);

  const visible = useMemo(
    () => filterDiscoveryItems(items, query, signalType || null),
    [items, query, signalType],
  );
  const types = availableTypes.length > 0 ? availableTypes : availableSignalTypes(items);

  function resetMatchState(item?: DiscoveryViewItem | null) {
    setSelectedCompany(null);
    setCompanyQuery("");
    setCreateName(item?.companyNameRaw ?? "");
    setCreateDomain(item?.domainRaw ?? "");
    setDismissConfirm(false);
  }

  async function loadList(nextStatus: UnresolvedSignalStatus, nextType = signalType) {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchDiscoveryList({
        status: nextStatus,
        signalType: nextType || undefined,
      });
      setItems(next);
      if (nextStatus === "NEW") setNewCount(next.length);
      if (nextStatus === "REVIEWED") setReviewedCount(next.length);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Entdeckungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function openItem(item: DiscoveryViewItem) {
    setSelectedId(item.id);
    setDetail(item);
    resetMatchState(item);
    setError(null);
    try {
      const full = await fetchDiscoveryItem(item.id);
      setDetail(full);
      resetMatchState(full);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Entdeckung konnte nicht geladen werden.");
    }
  }

  function applyUpdated(updated: DiscoveryViewItem) {
    setItems((current) => keepIfStatus(current, updated, status));
    if (status === "NEW" && updated.status !== "NEW") {
      setNewCount((count) => Math.max(0, count - 1));
    }
    if (updated.status === "REVIEWED" && status !== "REVIEWED") {
      setReviewedCount((count) => count + 1);
    }
    if (updated.status === "DISMISSED" || updated.status === "RESOLVED") {
      setSelectedId(null);
      setDetail(null);
      resetMatchState();
    } else {
      setDetail(updated);
      setSelectedId(updated.id);
    }
  }

  async function runMutation(action: () => Promise<DiscoveryViewItem>) {
    setPending(true);
    setError(null);
    try {
      const updated = await action();
      applyUpdated(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Die Aktion konnte nicht ausgeführt werden.");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (companyQuery.trim().length < 2 || companies.length > 0) return;
    let cancelled = false;
    setCompaniesLoading(true);
    fetchDiscoveryCompanies()
      .then((rows) => {
        if (!cancelled) setCompanies(rows);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unternehmen konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyQuery, companies.length]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-ink-muted">
          <span className="tabular text-ink">{newCount}</span> neu
          {reviewedCount > 0 ? (
            <>
              {" · "}
              <span className="tabular text-ink">{reviewedCount}</span> geprüft
            </>
          ) : null}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
          {DISCOVERY_STATUS_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={status === value ? "chip-accent" : "chip"}
              aria-pressed={status === value}
              disabled={loading || pending}
              onClick={() => {
                setStatus(value);
                setSelectedId(null);
                setDetail(null);
                void loadList(value);
              }}
            >
              {DISCOVERY_STATUS_LABELS[value]}
            </button>
          ))}
        </div>
        <EntitySearchField
          value={query}
          onChange={setQuery}
          placeholder="Titel, Unternehmen oder Domain…"
          label="Entdeckungen durchsuchen"
        />
      </div>

      {types.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Signaltyp">
          <button
            type="button"
            className={signalType === "" ? "chip-accent" : "chip"}
            disabled={loading || pending}
            onClick={() => setSignalType("")}
          >
            Alle Typen
          </button>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              className={signalType === type ? "chip-accent" : "chip"}
              disabled={loading || pending}
              onClick={() => setSignalType(type)}
            >
              {discoverySignalTypeLabel(type) ?? type}
            </button>
          ))}
        </div>
      ) : null}

      {error && !detail ? <p className="mb-4 text-sm text-score-warm">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-ink-muted">Entdeckungen werden geladen…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          title={status === "NEW" ? "Keine neuen Entdeckungen" : "Keine Entdeckungen"}
          description={
            status === "NEW"
              ? "Aktuell liegen keine ungeprüften Signale vor."
              : "Für diesen Filter gibt es gerade keine Einträge."
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
          <ul className="grid gap-4">
            {visible.map((item) => (
              <li key={item.id}>
                <DiscoveryCard
                  item={item}
                  selected={item.id === selectedId}
                  pending={pending}
                  onOpen={() => void openItem(item)}
                  onReview={
                    item.status === "NEW"
                      ? () => {
                          setSelectedId(item.id);
                          setDetail(item);
                          void runMutation(() => reviewDiscoveryItem(item.id));
                        }
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
          {detail ? (
            <DiscoveryDetail
              item={detail}
              pending={pending}
              error={error}
              companyQuery={companyQuery}
              companies={companies}
              companiesLoading={companiesLoading}
              selectedCompany={selectedCompany}
              createName={createName}
              createDomain={createDomain}
              dismissConfirm={dismissConfirm}
              onCompanyQueryChange={setCompanyQuery}
              onSelectCompany={setSelectedCompany}
              onCreateNameChange={setCreateName}
              onCreateDomainChange={setCreateDomain}
              onReview={() => void runMutation(() => reviewDiscoveryItem(detail.id))}
              onDismiss={() => setDismissConfirm(true)}
              onCancelDismiss={() => setDismissConfirm(false)}
              onConfirmDismiss={() => void runMutation(() => dismissDiscoveryItem(detail.id))}
              onResolveExisting={() => {
                if (!selectedCompany) return;
                void runMutation(() =>
                  resolveDiscoveryItem(detail.id, { companyId: selectedCompany.id }),
                );
              }}
              onResolveCreate={() => {
                const name = createName.trim();
                if (!name) return;
                void runMutation(() =>
                  resolveDiscoveryItem(detail.id, {
                    createCompany: {
                      name,
                      website: websiteFromDomain(createDomain),
                    },
                  }),
                );
              }}
              onBack={() => {
                setSelectedId(null);
                setDetail(null);
              }}
            />
          ) : (
            <p className="hidden text-sm text-ink-muted lg:block">
              Wähle eine Entdeckung, um sie zuzuordnen.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
