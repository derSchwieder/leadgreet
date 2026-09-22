import Link from "next/link";
import { BusinessCaseCard } from "@/components/recommendations/BusinessCaseCard";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { SignalFeedbackControls } from "@/components/signals/SignalFeedbackControls";
import { SignalSourceLine } from "@/components/signals/SignalSourceLine";
import { ScoreBreakdownBars } from "@/components/ui/ScoreBreakdownBars";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { displayStoredText } from "@/lib/display-copy";
import { formatDate } from "@/lib/format";
import { SCORING_DIMENSION_LABELS } from "@/lib/labels";
import { SCORING_WEIGHTS } from "@/lib/scoring";
import type { SignalFeedbackReason } from "@/types";
import { openableSourceUrl, toWhyNowView, type WhyNowSourceView } from "@/components/opportunities/greetelligence-view";
import type { BusinessCasePresentation } from "@/components/recommendations/business-case-view";
import type { RecommendationView } from "@/components/recommendations/partition";
import type { CompanyIntelligence } from "@/lib/intelligence";

const SCORE_ROWS = [
  { key: "signalStrength", label: SCORING_DIMENSION_LABELS.signalStrength },
  { key: "freshness", label: SCORING_DIMENSION_LABELS.freshness },
  { key: "companyFit", label: SCORING_DIMENSION_LABELS.companyFit },
  { key: "contactFit", label: SCORING_DIMENSION_LABELS.contactFit },
  { key: "confidence", label: SCORING_DIMENSION_LABELS.confidence },
] as const;

function SourceOpenLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:underline"
    >
      Quelle öffnen ↗
    </a>
  );
}

function WhyNowSource({ source }: { source: WhyNowSourceView }) {
  if (source.missing) {
    return <p className="mt-3 text-sm text-ink-muted">Quelle nicht hinterlegt</p>;
  }

  const text = [source.typeLabel, source.name].filter(Boolean).join(" · ");
  const heading = text ? `Quelle: ${text}` : "Quelle";

  return (
    <div className="mt-3 space-y-1 text-sm text-ink-muted">
      <p>{heading}</p>
      {source.date ? <p>{source.date}</p> : null}
      {source.url ? <p><SourceOpenLink href={source.url} /></p> : null}
    </div>
  );
}

export function OpportunityGreetelligence({
  chance,
  whyNow,
  presentation,
  primaries,
  alternatives,
  recommendedApproach,
  intelligence,
  signals,
  scores,
  explanation,
  feedbackBySignalId = {},
}: {
  chance: number;
  whyNow: string | null;
  presentation: BusinessCasePresentation;
  primaries: RecommendationView[];
  alternatives: RecommendationView[];
  recommendedApproach: string | null;
  intelligence: CompanyIntelligence;
  signals: Array<{
    id: string;
    type: string;
    title: string;
    detectedAt: Date | string;
    signalStrength?: number | null;
    sourceName: string | null;
    sourceUrl: string | null;
    sourceType?: string | null;
  }>;
  scores: {
    signalStrength: number;
    freshness: number;
    companyFit: number;
    contactFit: number;
    confidence: number;
  };
  explanation: string | null;
  feedbackBySignalId?: Record<string, { relevant: boolean; reason: SignalFeedbackReason | null }>;
}) {
  const whyNowView = toWhyNowView({
    signals,
    triggerId: intelligence.triggerSignal?.id ?? null,
  });
  const primary = primaries[0] ?? null;
  const serviceName = primary?.name ?? presentation.cases[0]?.serviceName ?? null;
  const serviceFit = primary?.matchScore ?? presentation.cases[0]?.serviceFit ?? null;
  const conversationStarter =
    primary?.conversationStarter ?? presentation.cases[0]?.conversationStarter ?? null;
  const content = intelligence.recommendedContent?.item;
  const hasSources = signals.some((signal) => signal.sourceName || signal.sourceUrl);

  return (
    <div className="space-y-8">
      <h2 className="section-label mb-0">Greetelligence</h2>

      <section className="surface-featured p-6 sm:p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          Warum jetzt?
        </p>
        {whyNowView ? (
          <>
            {whyNowView.category ? (
              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
                {whyNowView.category}
              </p>
            ) : null}
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {whyNowView.title}
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              {whyNowView.age}
              {whyNowView.strength != null ? (
                <>
                  {whyNowView.age ? " · " : null}
                  Signalstärke {whyNowView.strength}
                </>
              ) : null}
            </p>
            <WhyNowSource source={whyNowView.source} />
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink">{whyNowView.interpretation}</p>
            {whyNowView.supporting.length > 0 ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-ink-muted">
                  Weitere unterstützende Signale ({whyNowView.supporting.length})
                </summary>
                <ul className="mt-3 space-y-2">
                  {whyNowView.supporting.map((signal) => (
                    <li key={signal.id} className="text-sm text-ink">
                      <span className="font-medium">{signal.title}</span>
                      <span className="text-ink-muted">
                        {signal.category ? ` · ${signal.category}` : ""}
                        {` · ${signal.age}`}
                        {signal.strength != null ? ` · Stärke ${signal.strength}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm leading-6 text-ink-muted">Kein aktueller Anlass hinterlegt.</p>
        )}
      </section>

      <BusinessCaseCard presentation={presentation} />

      <div className="space-y-4">
        <section className="surface px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Passender Service
          </p>
          {serviceName ? (
            <>
              <p className="mt-2 text-base font-medium text-ink">{serviceName}</p>
              {serviceFit != null ? (
                <p className="mt-1 font-mono text-sm tabular text-accent">
                  {serviceFit} %{" "}
                  <span className="font-sans text-ink-muted">Service-Fit</span>
                </p>
              ) : null}
              <p className="mt-2 text-sm text-ink-muted">Der Service passt zum erkannten Vorhaben.</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">Kein passendes Angebot gefunden.</p>
          )}
        </section>

        <section className="surface px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">Signale</p>
          {signals.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Dieser Chance sind noch keine Signale zugeordnet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line/80">
              {signals.map((signal) => (
                <li key={signal.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="space-y-2">
                    <SignalTypeBadge type={signal.type} />
                    <p className="text-sm text-ink">{signal.title}</p>
                    <p className="text-xs text-ink-muted">{formatDate(signal.detectedAt)}</p>
                    <SignalSourceLine sourceName={signal.sourceName} sourceUrl={signal.sourceUrl} />
                    <SignalFeedbackControls signalId={signal.id} initial={feedbackBySignalId[signal.id] ?? null} />
                  </div>
                  {signal.signalStrength != null ? <ScoreBadge score={signal.signalStrength} /> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Gesprächsanlass
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink">
            {displayStoredText(conversationStarter, "Noch kein Gesprächsanlass hinterlegt.")}
          </p>
        </section>
      </div>

      <section className="surface p-5">
        <details>
          <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Wie entsteht der Chance-Score?
          </summary>
          <div className="mt-5 space-y-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">Chance</p>
              <p className="mt-1 font-mono text-3xl tabular text-accent">{chance}</p>
              <dl className="mt-4 space-y-1.5 text-sm">
                {SCORE_ROWS.map((row) => (
                  <div key={row.key} className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted">{row.label}</dt>
                    <dd className="font-mono tabular text-ink">{scores[row.key]}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <ScoreBreakdownBars scores={scores} />
            <p className="text-xs text-ink-muted">
              Gewichtungen: {SCORING_DIMENSION_LABELS.signalStrength} {SCORING_WEIGHTS.signalStrength},{" "}
              {SCORING_DIMENSION_LABELS.freshness} {SCORING_WEIGHTS.freshness},{" "}
              {SCORING_DIMENSION_LABELS.companyFit} {SCORING_WEIGHTS.companyFit},{" "}
              {SCORING_DIMENSION_LABELS.contactFit} {SCORING_WEIGHTS.contactFit},{" "}
              {SCORING_DIMENSION_LABELS.confidence} {SCORING_WEIGHTS.confidence}.
            </p>
            {whyNow ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
                  Vollständige Begründung
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{displayStoredText(whyNow)}</p>
              </div>
            ) : null}
            {explanation ? (
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-ink-muted">
                {displayStoredText(explanation)}
              </pre>
            ) : null}

            <RecommendationCard primaries={primaries} alternatives={alternatives} contactHref="#kontakte" />

            {recommendedApproach ? (
              <div>
                <SectionHeading>Passender Ansatz</SectionHeading>
                <p className="text-sm leading-6 text-ink-muted">{displayStoredText(recommendedApproach)}</p>
              </div>
            ) : null}

            <div>
              <SectionHeading>Empfohlener Content</SectionHeading>
              {content ? (
                <div className="space-y-2">
                  <ContentTypeBadge type={String(content.type)} />
                  {content.url ? (
                    <p>
                      <a
                        href={content.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-ink hover:text-accent"
                      >
                        {content.name}
                      </a>
                    </p>
                  ) : (
                    <p>
                      <Link href={`/content/${content.id}`} className="font-medium text-ink hover:text-accent">
                        {content.name}
                      </Link>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">Kein passender Inhalt in der eigenen Bibliothek.</p>
              )}
            </div>

            <div>
              <SectionHeading>Quellen-Nachweis</SectionHeading>
              {hasSources ? (
                <ul className="space-y-2 text-sm text-ink-muted">
                  {signals.map((signal) => {
                    const sourceUrl = openableSourceUrl(signal.sourceUrl);
                    return (
                      <li key={signal.id}>
                        {signal.sourceName ?? "Unbenannte Quelle"}
                        {sourceUrl ? (
                          <a
                            href={sourceUrl}
                            className="ml-2 text-accent hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Quelle öffnen ↗
                          </a>
                        ) : (
                          <span className="ml-2 text-ink-faint">Keine URL hinterlegt</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">Kein Quellen-Nachweis hinterlegt.</p>
              )}
            </div>
          </div>
        </details>
      </section>
    </div>
  );
}
