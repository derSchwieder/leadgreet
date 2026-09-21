const CLAIM = [
  "Find the signal.",
  "Start the conversation.",
  "Make business.",
  "Enjoy success.",
] as const;

export function BrandClaim({ compact = false }: { compact?: boolean }) {
  return (
    <p className={compact ? "space-y-1" : "space-y-1.5"} aria-label={CLAIM.join(" ")}>
      {CLAIM.map((line, index) => {
        const highlight = index === CLAIM.length - 1;
        return (
          <span
            key={line}
            className={`block ${
              compact ? "text-[11px] leading-4" : "text-xs leading-5"
            } ${
              highlight
                ? "font-semibold text-accent"
                : "text-ink-muted"
            }`}
          >
            {line}
          </span>
        );
      })}
    </p>
  );
}
