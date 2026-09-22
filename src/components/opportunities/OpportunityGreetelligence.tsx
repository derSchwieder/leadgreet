import Link from "next/link";
import { BusinessCaseCard } from "@/components/recommendations/BusinessCaseCard";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { ScoreBreakdownBars } from "@/components/ui/ScoreBreakdownBars";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { displayStoredText } from "@/lib/display-copy";
import { SCORING_DIMENSION_LABELS } from "@/lib/labels";
import { SCORING_WEIGHTS } from "@/lib/scoring";
import { toSignalRow, toWhyNowView, type WhyNowSourceView } from "@/components/opportunities/greetelligence-view";
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

function WhyNowSource({ source }: { source: WhyNowSourceView }) {
  if (source.missing) {
    return <p className="mt-3 text-sm text-ink-muted">Quelle nicht hinterlegt</p>;
  }

  const text = [source.typeLabel, source.name].filter(Boolean).join(" · ");
  const heading = text ? `Quelle: ${text}` : "Quelle";
  const dateLine = source.date ? (source.url ? `${source.date} ↗` : source.date) : source.url ? "↗" : null;

  const body = (
    <>
      <span className="block">{heading}</span>
      {dateLine ? <span className="mt-0.5 block">{dateLine}</span> : null}
    </>
  );

  if (source.url) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {body}
        </a>
      </p>
    );
  }

  return <p className="mt-3 text-sm text-ink-muted">{body}</p>;
}

export function OpportunityGreetelligence({
  greet,
  whyNow,
  presentation,
  primaries,
  alternatives,
  recommendedApproach,
  intelligence,
  signals,
  scores,
  explanation,
}: {
  greet: number;
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
  const signalRows = signals.map((signal) => toSignalRow(signal));
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
          {signalRows.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">Dieser Chance sind noch keine Signale zugeordnet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line/80">
              {signalRows.map((signal) => (
                <li key={signal.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-ink">{signal.name}</p>
                  <p className="text-xs tabular text-ink-muted">
                    {signal.age}
                    {signal.strength != null ? ` · Stärke ${signal.strength}` : ""}
                  </p>
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
            Wie entsteht der Greet dieses Anlasses?
          </summary>
          <div className="mt-5 space-y-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">Greet</p>
              <p className="mt-1 font-mono text-3xl tabular text-accent">{greet}</p>
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
                  {signals.map((signal) => (
                    <li key={signal.id}>
                      {signal.sourceName ?? "Unbenannte Quelle"}
                      {signal.sourceUrl ? (
                        <a
                          href={signal.sourceUrl}
                          className="ml-2 text-accent hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Öffnen
                        </a>
                      ) : (
                        <span className="ml-2 text-ink-faint">Keine URL hinterlegt</span>
                      )}
                    </li>
                  ))}
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
