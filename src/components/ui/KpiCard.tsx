export function KpiCard({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <article
      className={`relative overflow-hidden p-5 ${emphasis ? "surface-featured" : "surface"}`}
    >
      {emphasis ? <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" /> : null}
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">{label}</p>
      <p className={`mt-4 font-mono text-3xl tabular ${emphasis ? "text-accent" : "text-ink"}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-ink-muted">{hint}</p> : null}
    </article>
  );
}
