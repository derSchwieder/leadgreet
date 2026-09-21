import { SCORING_WEIGHTS } from "@/lib/scoring";
import { SCORING_DIMENSION_LABELS } from "@/lib/labels";

const BARS: Array<{ key: keyof typeof SCORING_WEIGHTS; label: string }> = [
  { key: "signalStrength", label: SCORING_DIMENSION_LABELS.signalStrength ?? "Signalstärke" },
  { key: "freshness", label: SCORING_DIMENSION_LABELS.freshness ?? "Aktualität" },
  { key: "companyFit", label: SCORING_DIMENSION_LABELS.companyFit ?? "Unternehmens-Fit" },
  { key: "contactFit", label: SCORING_DIMENSION_LABELS.contactFit ?? "Kontakt-Fit" },
  { key: "confidence", label: SCORING_DIMENSION_LABELS.confidence ?? "Sicherheit" },
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
    <dl className="space-y-3.5">
      {BARS.map((bar) => {
        const value = scores[bar.key];
        const weight = SCORING_WEIGHTS[bar.key];
        const contribution = Math.round((value / 100) * weight * 10) / 10;
        return (
          <div key={bar.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-ink-muted">{bar.label}</dt>
              <dd className="font-mono tabular text-ink">
                {value}
                <span className="ml-2 text-ink-muted">
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
