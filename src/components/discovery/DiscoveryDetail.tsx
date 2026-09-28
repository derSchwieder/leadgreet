"use client";

import { EntitySearchField } from "@/components/ui/EntitySearchField";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { display, formatDate } from "@/lib/format";
import { normalizeSearchQuery } from "@/lib/search/entity-search";
import {
  DISCOVERY_STATUS_LABELS,
  discoverySignalTypeLabel,
  type DiscoveryViewItem,
} from "./discovery-presentation";
import type { DiscoveryCompanyOption } from "./discovery-api";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line/80 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <div className="mt-0.5 text-sm leading-6 text-ink">{children}</div>
    </div>
  );
}

export function DiscoveryDetail({
  item,
  pending,
  error,
  companyQuery,
  companies,
  companiesLoading = false,
  selectedCompany,
  createName,
  createDomain,
  dismissConfirm,
  onCompanyQueryChange,
  onSelectCompany,
  onCreateNameChange,
  onCreateDomainChange,
  onReview,
  onDismiss,
  onConfirmDismiss,
  onCancelDismiss,
  onResolveExisting,
  onResolveCreate,
  onBack,
}: {
  item: DiscoveryViewItem;
  pending: boolean;
  error: string | null;
  companyQuery: string;
  companies: DiscoveryCompanyOption[];
  companiesLoading?: boolean;
  selectedCompany: DiscoveryCompanyOption | null;
  createName: string;
  createDomain: string;
  dismissConfirm: boolean;
  onCompanyQueryChange: (value: string) => void;
  onSelectCompany: (company: DiscoveryCompanyOption | null) => void;
  onCreateNameChange: (value: string) => void;
  onCreateDomainChange: (value: string) => void;
  onReview: () => void;
  onDismiss: () => void;
  onConfirmDismiss: () => void;
  onCancelDismiss: () => void;
  onResolveExisting: () => void;
  onResolveCreate: () => void;
  onBack?: () => void;
}) {
  const canAct = item.status === "NEW" || item.status === "REVIEWED";
  const typeLabel = discoverySignalTypeLabel(item.signalType);
  const needle = normalizeSearchQuery(companyQuery);
  const matches =
    needle.length >= 2
      ? companies.filter((company) => company.name.toLocaleLowerCase("de").includes(needle)).slice(0, 8)
      : [];

  return (
    <aside className="surface p-5 lg:sticky lg:top-6">
      {onBack ? (
        <button type="button" className="mb-4 text-sm text-ink-muted hover:text-ink" onClick={onBack}>
          Zurück zur Liste
        </button>
      ) : null}
      <p className="section-label">Entdeckung</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{DISCOVERY_STATUS_LABELS[item.status]}</span>
        {item.signalType ? <SignalTypeBadge type={item.signalType} /> : null}
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-tight text-ink">{item.title}</h2>
      {item.description ? (
        <p className="mt-2 text-sm leading-6 text-ink-muted">{item.description}</p>
      ) : null}

      <DetailRow label="Signaltyp">{typeLabel ?? "—"}</DetailRow>
      <DetailRow label="Erkannt">{formatDate(item.detectedAt)}</DetailRow>
      <DetailRow label="Veröffentlicht">{formatDate(item.publishedAt)}</DetailRow>
      <DetailRow label="Quelle">
        {item.sourceUrl ? (
          <a href={item.sourceUrl} className="link-inline break-all" target="_blank" rel="noreferrer">
            {item.source || item.sourceUrl}
          </a>
        ) : (
          display(item.source)
        )}
      </DetailRow>

      <p className="section-label mt-6">Erkannte Entity</p>
      <DetailRow label="Unternehmen">{display(item.companyNameRaw)}</DetailRow>
      <DetailRow label="Domain">{display(item.domainRaw)}</DetailRow>
      <DetailRow label="Person">{display(item.personNameRaw)}</DetailRow>
      <DetailRow label="Ort">{display(item.locationRaw)}</DetailRow>
      <DetailRow label="Confidence">
        {item.confidence != null ? `${item.confidence} %` : "—"}
      </DetailRow>

      {item.resolvedCompany ? (
        <DetailRow label="Zugeordnet">{item.resolvedCompany.name}</DetailRow>
      ) : null}
      {item.resolvedSignal ? (
        <DetailRow label="Signal">{item.resolvedSignal.title}</DetailRow>
      ) : null}

      {canAct ? (
        <div className="mt-6 space-y-5">
          <div>
            <p className="section-label">Unternehmen zuordnen</p>
            {selectedCompany ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-ink">{selectedCompany.name}</p>
                <button
                  type="button"
                  className="text-xs text-ink-muted hover:text-ink"
                  disabled={pending}
                  onClick={() => onSelectCompany(null)}
                >
                  Ändern
                </button>
              </div>
            ) : (
              <>
                <EntitySearchField
                  value={companyQuery}
                  onChange={onCompanyQueryChange}
                  placeholder="Unternehmen suchen…"
                  label="Unternehmen suchen"
                />
                {needle.length >= 2 && companiesLoading ? (
                  <p className="mt-2 text-sm text-ink-muted">Unternehmen werden geladen…</p>
                ) : null}
                {needle.length >= 2 && !companiesLoading && matches.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">Kein Treffer im Bestand.</p>
                ) : null}
                {matches.length > 0 ? (
                  <ul className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line">
                    {matches.map((company) => (
                      <li key={company.id}>
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-canvas-hover"
                          disabled={pending}
                          onClick={() => onSelectCompany(company)}
                        >
                          {company.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
            <button
              type="button"
              className="btn-primary mt-3"
              disabled={pending || !selectedCompany}
              onClick={onResolveExisting}
            >
              Signal übernehmen
            </button>
          </div>

          <div>
            <p className="section-label">Neue Company anlegen</p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Firmenname</span>
              <input
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
                value={createName}
                disabled={pending}
                onChange={(event) => onCreateNameChange(event.target.value)}
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Domain optional</span>
              <input
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
                value={createDomain}
                disabled={pending}
                placeholder="datev.de"
                onChange={(event) => onCreateDomainChange(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn-ghost mt-3"
              disabled={pending || createName.trim().length === 0}
              onClick={onResolveCreate}
            >
              Neue Company anlegen
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {item.status === "NEW" ? (
              <button type="button" className="btn-ghost" disabled={pending} onClick={onReview}>
                Prüfen
              </button>
            ) : null}
            {dismissConfirm ? (
              <>
                <button type="button" className="btn-ghost" disabled={pending} onClick={onConfirmDismiss}>
                  Wirklich ignorieren
                </button>
                <button type="button" className="btn-ghost" disabled={pending} onClick={onCancelDismiss}>
                  Abbrechen
                </button>
              </>
            ) : (
              <button type="button" className="btn-ghost" disabled={pending} onClick={onDismiss}>
                Ignorieren
              </button>
            )}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-score-warm">{error}</p> : null}
    </aside>
  );
}
