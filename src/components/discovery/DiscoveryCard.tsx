"use client";

import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import {
  DISCOVERY_STATUS_LABELS,
  discoverySignalCategoryLabel,
  discoverySignalTypeLabel,
  formatRelativeDetectedAt,
  type DiscoveryViewItem,
} from "./discovery-presentation";

export function DiscoveryCard({
  item,
  selected,
  pending,
  onOpen,
  onReview,
}: {
  item: DiscoveryViewItem;
  selected?: boolean;
  pending?: boolean;
  onOpen: () => void;
  onReview?: () => void;
}) {
  const typeLabel = discoverySignalTypeLabel(item.signalType);
  const categoryLabel = discoverySignalCategoryLabel(item.signalType);
  const entity = item.companyNameRaw ?? item.domainRaw;

  return (
    <article
      className={`surface p-5 ${selected ? "border-accent/40" : ""}`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm font-medium leading-6 text-ink">{item.title}</p>
          <span className="chip">{DISCOVERY_STATUS_LABELS[item.status]}</span>
        </div>
        {entity ? <p className="mt-3 text-sm text-ink">{entity}</p> : null}
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-muted">{item.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          {item.signalType ? <SignalTypeBadge type={item.signalType} /> : null}
          {categoryLabel && typeLabel ? <span>{categoryLabel}</span> : null}
          <span>{formatRelativeDetectedAt(item.detectedAt)}</span>
          {item.source ? <span>{item.source}</span> : null}
        </div>
        {item.confidence != null ? (
          <p className="mt-3 text-xs tabular text-ink-muted">Confidence {item.confidence} %</p>
        ) : null}
      </button>
      {item.status === "NEW" && onReview ? (
        <div className="mt-4">
          <button
            type="button"
            className="btn-primary"
            disabled={pending}
            onClick={onReview}
          >
            Prüfen
          </button>
        </div>
      ) : null}
    </article>
  );
}
