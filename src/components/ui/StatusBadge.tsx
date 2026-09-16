export function StatusBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded border border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-muted">
      {value.replaceAll("_", " ")}
    </span>
  );
}
