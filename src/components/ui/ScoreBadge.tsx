import { scoreTone } from "@/lib/format";

export function ScoreBadge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const color =
    tone === "hot" ? "text-accent" : tone === "warm" ? "text-score-warm" : "text-ink-muted";

  return (
    <span className={`font-mono text-sm tabular ${color}`} aria-label={`Score ${score}`}>
      {score}
    </span>
  );
}
