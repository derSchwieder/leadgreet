import { LeadgreetSignet } from "@/components/brand/LeadgreetLogo";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RecommendationReasons } from "./RecommendationReasons";
import type { RecommendationView } from "./partition";

function ServiceFit({ score }: { score: number }) {
  return (
    <p className="mt-1 font-mono text-2xl tabular text-accent">
      {score} %{" "}
      <span className="text-sm font-sans font-medium tracking-normal text-ink-muted">
        Service-Fit
      </span>
    </p>
  );
}

function ConversationStarter({ text, anchor }: { text: string; anchor?: boolean }) {
  return (
    <div
      id={anchor ? "gespraechseinstieg" : undefined}
      className="flex scroll-mt-24 gap-3.5 rounded-xl bg-canvas-elevated/80 px-4 py-4"
    >
      <LeadgreetSignet size={36} />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Gesprächseinstieg
        </p>
        <p className="mt-2 text-sm leading-6 text-ink">Signal → Gespräch</p>
        <blockquote className="mt-2 text-base leading-7 text-ink">
          {text}
        </blockquote>
      </div>
    </div>
  );
}

function RecommendationBlock({
  item,
  featured,
  starterAnchor,
}: {
  item: RecommendationView;
  featured: boolean;
  starterAnchor?: boolean;
}) {
  return (
    <article className={featured ? "space-y-5" : "space-y-3"}>
      <div>
        <h3 className={featured ? "text-xl font-semibold tracking-tight text-ink" : "text-base font-semibold text-ink"}>
          {item.name}
        </h3>
        <ServiceFit score={item.matchScore} />
      </div>
      <RecommendationReasons reasons={item.reasons} />
      {item.matchedSignals.length > 0 ? (
        <div>
          <h4 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Passende Signale
          </h4>
          <ul className="mt-3 space-y-1.5">
            {item.matchedSignals.map((signal) => (
              <li key={signal} className="text-sm leading-6 text-ink-muted">
                {signal}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {item.conversationStarter ? (
        <ConversationStarter text={item.conversationStarter} anchor={starterAnchor} />
      ) : null}
    </article>
  );
}

export function RecommendationCard({
  primaries,
  alternatives,
  contactHref,
}: {
  primaries: RecommendationView[];
  alternatives: RecommendationView[];
  contactHref?: string;
}) {
  if (primaries.length === 0) {
    return (
      <section className="surface-featured p-6 sm:p-7">
        <SectionHeading>Empfehlung</SectionHeading>
        <EmptyState
          title="Kein passendes Angebot"
          description="Für diese Opportunity wurde aktuell kein passendes Angebot aus deinem Portfolio gefunden."
        />
      </section>
    );
  }

  const tied = primaries.length > 1;

  return (
    <section className="surface-featured space-y-8 p-6 sm:p-7">
      <SectionHeading>{tied ? "Top-Empfehlungen" : "Empfehlung"}</SectionHeading>

      <div className="space-y-8">
        {primaries.map((item, index) => (
          <RecommendationBlock
            key={item.name}
            item={item}
            featured
            starterAnchor={index === 0}
          />
        ))}
      </div>

      {contactHref ? (
        <a href={contactHref} className="btn-ghost inline-flex">
          Gespräch vorbereiten
        </a>
      ) : null}

      {alternatives.length > 0 ? (
        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Weitere passende Angebote
          </h3>
          <ul className="mt-3 space-y-2">
            {alternatives.map((item) => (
              <li key={item.name} className="text-sm text-ink">
                {item.name}
                <span className="ml-2 font-mono tabular text-ink-muted">
                  · {item.matchScore} %
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
