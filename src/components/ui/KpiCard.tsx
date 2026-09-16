export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <article className="rounded-lg border border-line bg-canvas-card p-4 shadow-card">
      <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint">{label}</p>
      <p className="mt-3 font-mono text-3xl tabular text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ink-muted">{hint}</p> : null}
    </article>
  );
}
