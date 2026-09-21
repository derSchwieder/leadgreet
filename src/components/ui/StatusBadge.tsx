import { formatEnum } from "@/lib/format";

const POSITIVE = new Set(["NEW", "QUALIFIED", "WON", "MEETING", "OPPORTUNITY"]);
const NEGATIVE = new Set(["LOST", "DISMISSED"]);

export function StatusBadge({ value }: { value: string }) {
  const tone = POSITIVE.has(value)
    ? "border-accent/25 bg-accent-glow text-accent"
    : NEGATIVE.has(value)
      ? "border-danger/20 bg-danger/10 text-danger"
      : "border-line bg-canvas-elevated text-ink-muted";

  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide ${tone}`}>
      {formatEnum(value)}
    </span>
  );
}
