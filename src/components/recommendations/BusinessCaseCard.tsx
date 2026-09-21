import { SectionHeading } from "@/components/ui/SectionHeading";
import type { BusinessCasePresentation, BusinessCaseView } from "./business-case-view";
import { BUSINESS_CASE_FRAMING } from "./business-case-view";

function CaseCard({ item }: { item: BusinessCaseView }) {
  return (
    <article className="rounded-lg border border-line px-4 py-4">
      <p className="text-lg font-semibold tracking-tight text-ink sm:text-xl">{item.label}</p>
      {item.confidence != null ? (
        <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Signalunterstützung{" "}
          <span className="font-mono tabular text-ink">{item.confidence}</span>
        </p>
      ) : null}
      {item.hypothesis ? (
        <p className="mt-3 text-sm leading-6 text-ink-muted">{item.hypothesis}</p>
      ) : null}

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-ink-muted">Warum?</summary>
        <div className="mt-3 space-y-4">
          {item.supportingSignals.length > 0 ? (
            <ul className="space-y-1.5">
              {item.supportingSignals.map((signal) => (
                <li key={signal.title} className="text-sm text-ink">
                  {signal.typeLabel ?? signal.title}
                  {signal.detectedAt ? (
                    <span className="text-ink-muted"> · Aktualität {signal.detectedAt}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm leading-6 text-ink-muted">{BUSINESS_CASE_FRAMING}</p>
          {item.valueProposition ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
                Passender Ansatz
              </p>
              <p className="mt-1.5 text-sm leading-6 text-ink">{item.valueProposition}</p>
            </div>
          ) : null}
        </div>
      </details>
    </article>
  );
}

export function BusinessCaseCard({
  presentation,
}: {
  presentation: BusinessCasePresentation;
}) {
  return (
    <section>
      <SectionHeading>Mögliche Business Cases</SectionHeading>
      {presentation.empty ? (
        <p className="text-sm leading-6 text-ink-muted">{presentation.emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {presentation.cases.map((item) => (
            <CaseCard key={item.type} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
