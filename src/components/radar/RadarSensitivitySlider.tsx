export function RadarSensitivitySlider({
  threshold,
  onChange,
  visibleCount,
  searchHitCount,
  searching = false,
}: {
  threshold: number;
  onChange: (value: number) => void;
  visibleCount: number;
  searchHitCount?: number;
  searching?: boolean;
}) {
  return (
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
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="w-8 text-right font-mono text-[11px] tabular-nums text-ink-faint">
          100
        </span>
      </div>
      <p className="mt-2 font-mono text-xs tracking-wide text-accent">
        GREET {threshold} · {visibleCount} Unternehmen
        {searching ? ` · ${searchHitCount ?? 0} Treffer` : ""}
      </p>
    </label>
  );
}
