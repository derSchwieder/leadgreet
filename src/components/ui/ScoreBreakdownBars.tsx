import { SCORING_WEIGHTS } from "@/lib/scoring";

const BARS: Array<{ key: keyof typeof SCORING_WEIGHTS; label: string }> = [
  { key: "signalStrength", label: "Signal Strength" },
  { key: "freshness", label: "Freshness" },
  { key: "companyFit", label: "Company Fit" },
  { key: "contactFit", label: "Contact Fit" },
  { key: "confidence", label: "Confidence" },
];

export function ScoreBreakdownBars({
  scores,
}: {
  scores: {
    signalStrength: number;
    freshness: number;
    companyFit: number;
    contactFit: number;
    confidence: number;
  };
}) {
  return (
    <dl className="space-y-3">
      {BARS.map((bar) => {
        const value = scores[bar.key];
        const weight = SCORING_WEIGHTS[bar.key];
        const contribution = Math.round(((value / 100) * weight) * 10) / 10;
        return (
          <div key={bar.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-ink-muted">{bar.label}</dt>
              <dd className="font-mono tabular text-ink">
                {value}
                <span className="ml-2 text-ink-faint">
                  +{contribution} / {weight}
                </span>
              </dd>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-canvas-hover">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
              />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
