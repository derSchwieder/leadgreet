export function RecommendationReasons({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;

  return (
    <div>
      <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        Warum diese Empfehlung?
      </h3>
      <ul className="mt-3 space-y-2">
        {reasons.map((reason) => (
          <li key={reason} className="flex gap-2 text-sm leading-6 text-ink">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
