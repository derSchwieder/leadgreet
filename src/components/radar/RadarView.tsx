"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { RadarCompanyList } from "./RadarCompanyList";
import { RadarCompanyPreview } from "./RadarCompanyPreview";
import { filterVisibleRadarPoints } from "@/lib/radar";
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

export function RadarView({ points }: { points: RadarPoint[] }) {
  const [threshold, setThreshold] = useState(0);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const visiblePoints = useMemo(
    () => filterVisibleRadarPoints(points, threshold),
    [points, threshold],
  );
  const visibleCount = visiblePoints.length;
  const selectedPoint =
    visiblePoints.find((point) => point.companyId === selectedCompanyId) ?? null;

  useEffect(() => {
    if (
      selectedCompanyId &&
      !visiblePoints.some((point) => point.companyId === selectedCompanyId)
    ) {
      setSelectedCompanyId(null);
    }
  }, [selectedCompanyId, visiblePoints]);

  if (points.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-muted">
        Keine kartenfähigen Unternehmen für diesen Account.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-line px-5 py-3.5">
        <label className="block" htmlFor="radar-sensitivity">
          <span className="mb-2.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Radar-Empfindlichkeit
          </span>
          <div className="flex items-center gap-3">
            <span className="w-6 font-mono text-[11px] tabular-nums text-ink-faint">0</span>
            <input
              id="radar-sensitivity"
              className="radar-sensitivity-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={threshold}
              style={{ ["--radar-pct" as string]: `${threshold}%` }}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={threshold}
              aria-valuetext={`Greet ${threshold}, ${visibleCount} Unternehmen`}
              onChange={(event) => setThreshold(Number(event.target.value))}
            />
            <span className="w-8 text-right font-mono text-[11px] tabular-nums text-ink-faint">
              100
            </span>
          </div>
        </label>
        <p className="mt-2.5 font-mono text-xs tracking-wide text-accent">
          GREET {threshold} · {visibleCount} Unternehmen
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-[280px] flex-1 lg:min-h-0">
          <RadarMap
            points={points}
            threshold={threshold}
            selectedCompanyId={selectedCompanyId}
            onSelect={setSelectedCompanyId}
          />
        </div>
        {selectedPoint ? (
          <RadarCompanyPreview point={selectedPoint} onBack={() => setSelectedCompanyId(null)} />
        ) : (
          <RadarCompanyList
            points={visiblePoints}
            selectedCompanyId={selectedCompanyId}
            onSelect={setSelectedCompanyId}
          />
        )}
      </div>
    </div>
  );
}
