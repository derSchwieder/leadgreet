import type { ReactNode } from "react";

export function SectionHeading({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <h2 className="section-label mb-0">{children}</h2>
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}
