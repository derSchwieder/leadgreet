import { scoreTone } from "@/lib/format";

export function ScoreBadge({ score, label = "Bewertung" }: { score: number; label?: string }) {
  const tone = scoreTone(score);
  const color =
    tone === "hot"
      ? "border-accent/30 bg-accent-glow text-accent"
      : tone === "warm"
        ? "border-score-warm/30 bg-score-warm/10 text-score-warm"
        : "border-line bg-canvas-elevated text-ink-muted";

  return (
    <span
      className={`inline-flex min-w-[2.25rem] justify-center rounded-md border px-2 py-0.5 font-mono text-sm tabular ${color}`}
      aria-label={`${label} ${score}`}
    >
      {score}
    </span>
  );
}
