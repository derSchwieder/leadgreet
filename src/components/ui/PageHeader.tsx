export function PageHeader({
  eyebrow,
  title,
  description,
  className = "mb-8",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-ink">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>
      ) : null}
    </header>
  );
}
