import Link from "next/link";
import type { ReactNode } from "react";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { activityOutcomeLabel, activityTypeLabel } from "@/lib/labels";
import { formatDate, formatEnum } from "@/lib/format";
import { NEXT_STEP_LABELS, type CompanyIntelligence } from "@/lib/intelligence";

function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 border-t border-line/80 py-4 first:border-t-0 first:pt-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <div className="min-w-0 text-sm leading-6 text-ink">{children}</div>
    </div>
  );
}

function Absent({ children }: { children: string }) {
  return <p className="text-ink-muted">{children}</p>;
}

export function SalesIntelligencePanel({ intelligence }: { intelligence: CompanyIntelligence }) {
  const service = intelligence.primaryService;
  const content = intelligence.recommendedContent?.item;
  const businessCase = intelligence.primaryBusinessCase;
  const cases = intelligence.businessCases;

  return (
    <section className="mb-8">
      <SectionHeading hint="Signal, Portfolio und Historie in einer Sicht">
        Vertriebsintelligenz
      </SectionHeading>
      <div className="surface-featured p-5 sm:p-6">
        <Row label="Warum relevant?">
          {intelligence.triggerSignal ? (
            <div className="space-y-2">
              <SignalTypeBadge type={String(intelligence.triggerSignal.type)} />
              <p>{intelligence.triggerSignal.title}</p>
            </div>
          ) : (
            <Absent>Noch kein öffentliches Signal für diesen Anlass.</Absent>
          )}
        </Row>

        <Row label="Passender Service">
          {service ? (
            <div>
              <p className="font-medium">{service.service.name}</p>
              <p className="mt-1 text-ink-muted">
                Service-Fit {service.matchScore} % · eigenes Portfolio
              </p>
            </div>
          ) : (
            <Absent>Kein passender Service im eigenen Portfolio.</Absent>
          )}
        </Row>

        <Row label="Business Case">
          {businessCase ? (
            <div>
              <p>{formatEnum(businessCase.type)}</p>
              {businessCase.reasons[0] ? (
                <p className="mt-1 text-ink-muted">{businessCase.reasons[0]}</p>
              ) : null}
            </div>
          ) : cases.length > 0 ? (
            <div>
              <p>Mehrere mögliche Hebel, ohne eindeutigen Favoriten.</p>
              <p className="mt-1 text-ink-muted">{cases.map((item) => formatEnum(item.type)).join(" · ")}</p>
            </div>
          ) : (
            <Absent>Noch kein belastbarer Business Case aus den Signalen.</Absent>
          )}
        </Row>

        <Row label="Passender Ansprechpartner">
          {intelligence.matchingContact ? (
            <p>
              {intelligence.matchingContact.fullName}
              <span className="text-ink-muted">
                {" "}
                · {formatEnum(intelligence.matchingContact.role)}
                {intelligence.matchingContact.isDecisionMaker ? " · Entscheider" : ""}
              </span>
            </p>
          ) : (
            <Absent>Kein Kontakt mit passender Zielrolle vorhanden.</Absent>
          )}
        </Row>

        <Row label="Empfohlener Inhalt">
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
            <Absent>Kein passender Inhalt in der eigenen Bibliothek.</Absent>
          )}
        </Row>

        <Row label="Bisherige Aktivitäten">
          {intelligence.recentActivities.length > 0 ? (
            <ul className="space-y-2">
              {intelligence.recentActivities.map((activity) => (
                <li key={activity.id}>
                  <span className="text-ink-faint">{formatDate(activity.occurredAt)}</span>
                  {" · "}
                  {activityTypeLabel(String(activity.type))}
                  {activity.subject ? ` · ${activity.subject}` : ""}
                  {activity.outcome ? (
                    <span className="text-ink-muted"> · {activityOutcomeLabel(String(activity.outcome))}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <Absent>Noch keine Aktivitäten für dieses Unternehmen dokumentiert.</Absent>
          )}
        </Row>

        <div className="mt-2 rounded-xl bg-canvas-elevated/80 px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Nächster Schritt
          </p>
          <p className="mt-2 text-base font-medium text-ink">{NEXT_STEP_LABELS[intelligence.nextStep]}</p>
          <p className="mt-1 text-sm leading-6 text-ink-muted">{intelligence.nextStepReason}</p>
        </div>
      </div>
    </section>
  );
}
