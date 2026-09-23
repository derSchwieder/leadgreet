"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { RadarCompanyList } from "./RadarCompanyList";
import { RadarCompanyPreview } from "./RadarCompanyPreview";
import { RadarSensitivitySlider } from "./RadarSensitivitySlider";
import { EntitySearchField } from "@/components/ui/EntitySearchField";
import { countVisibleRadarPoints } from "@/lib/radar";
import { filterRadarPointsBySearch, normalizeSearchQuery } from "@/lib/search/entity-search";
import type { RadarPoint } from "@/lib/radar";

const RadarMap = dynamic(
  () => import("./RadarMap").then((module) => module.RadarMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        Karte wird geladen…
      </div>
    ),
  },
);

export function RadarView({
  points,
  threshold: thresholdProp,
  query: queryProp,
  onThresholdChange,
  onQueryChange,
  hideControls = false,
}: {
  points: RadarPoint[];
  threshold?: number;
  query?: string;
  onThresholdChange?: (value: number) => void;
  onQueryChange?: (value: string) => void;
  hideControls?: boolean;
}) {
  const [uncontrolledThreshold, setUncontrolledThreshold] = useState(0);
  const [uncontrolledQuery, setUncontrolledQuery] = useState("");
  const threshold = thresholdProp ?? uncontrolledThreshold;
  const query = queryProp ?? uncontrolledQuery;
  const setThreshold = onThresholdChange ?? setUncontrolledThreshold;
  const setQuery = onQueryChange ?? setUncontrolledQuery;
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const thresholdCount = countVisibleRadarPoints(points, threshold);
  const listedPoints = useMemo(
    () => filterRadarPointsBySearch(points, query, threshold),
    [points, query, threshold],
  );
  const searching = normalizeSearchQuery(query).length > 0;
  const selectedPoint =
    listedPoints.find((point) => point.companyId === selectedCompanyId) ?? null;

  useEffect(() => {
    if (
      selectedCompanyId &&
      !listedPoints.some((point) => point.companyId === selectedCompanyId)
    ) {
      setSelectedCompanyId(null);
    }
  }, [selectedCompanyId, listedPoints]);

  useEffect(() => {
    if (!searching) return;
    if (listedPoints.length === 1 && listedPoints[0]) {
      setSelectedCompanyId(listedPoints[0].companyId);
    }
  }, [searching, listedPoints]);

  const showPreview =
    Boolean(selectedPoint) && (!searching || listedPoints.length === 1);

  if (points.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-muted">
        Keine kartenfähigen Unternehmen für diesen Account.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {hideControls ? null : (
        <div className="shrink-0 space-y-3 border-b border-line px-5 py-3.5">
          <EntitySearchField
            id="radar-company-search"
            value={query}
            onChange={setQuery}
            placeholder="Unternehmen suchen …"
            label="Unternehmen im Radar suchen"
          />
          <RadarSensitivitySlider
            threshold={threshold}
            onChange={setThreshold}
            visibleCount={thresholdCount}
            searchHitCount={listedPoints.length}
            searching={searching}
          />
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-[280px] flex-1 lg:min-h-0">
          <RadarMap
            points={points}
            threshold={threshold}
            searchQuery={query}
            selectedCompanyId={selectedCompanyId}
            onSelect={setSelectedCompanyId}
          />
        </div>
        {showPreview && selectedPoint ? (
          <RadarCompanyPreview point={selectedPoint} onBack={() => setSelectedCompanyId(null)} />
        ) : (
          <RadarCompanyList
            points={listedPoints}
            selectedCompanyId={selectedCompanyId}
            onSelect={setSelectedCompanyId}
            emptyLabel={
              searching
                ? "Kein Treffer über dieser Schwelle."
                : "Keine Unternehmen über dieser Schwelle."
            }
          />
        )}
      </div>
    </div>
  );
}
