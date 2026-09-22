import Link from "next/link";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { displayLocation } from "@/lib/format";
import type { RadarPoint } from "@/lib/radar";

function signalLabel(title: string | null): string | null {
  if (!title) return null;
  const cleaned = title.replace(/^\[DEMO\]\s*/, "").trim();
  return cleaned || null;
}

export function RadarCompanyList({
  points,
  selectedCompanyId,
  onSelect,
  emptyLabel = "Keine Unternehmen über dieser Schwelle.",
}: {
  points: RadarPoint[];
  selectedCompanyId: string | null;
  onSelect: (companyId: string) => void;
  emptyLabel?: string;
}) {
  return (
    <aside className="flex max-h-64 min-h-0 w-full shrink-0 flex-col border-t border-line lg:max-h-none lg:w-[19.5rem] lg:border-l lg:border-t-0">
      <p className="shrink-0 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        Im Radar
      </p>
      {points.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-ink-muted">{emptyLabel}</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {points.map((point) => {
            const signal = signalLabel(point.signalTitle);
            const selected = point.companyId === selectedCompanyId;
            return (
              <li key={point.companyId}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  onClick={() => onSelect(point.companyId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(point.companyId);
                    }
                  }}
                  className={`cursor-pointer border-t border-line/80 px-4 py-3 transition-colors ${
                    selected ? "bg-canvas-hover" : "hover:bg-canvas-hover/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex min-w-0 items-center gap-2.5">
                      <CompanyLogo name={point.name} size="xs" />
                      <span className="truncate font-medium text-ink">{point.name}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
                        Greet
                      </span>
                      <ScoreBadge score={point.greet} label="Greet" />
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-muted">
                    {displayLocation(point.city, point.country)}
                  </p>
                  {signal ? (
                    <p className="mt-1 truncate text-xs text-ink-muted">{signal}</p>
                  ) : null}
                  <Link
                    href={`/companies/${point.companyId}`}
                    onClick={(event) => event.stopPropagation()}
                    className="mt-2 inline-block text-xs text-accent hover:text-[#3ad7be]"
                  >
                    Unternehmen öffnen
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
