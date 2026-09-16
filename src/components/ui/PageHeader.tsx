export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-6">
      {eyebrow ? (
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-ink-faint">{eyebrow}</p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
    </header>
  );
}
