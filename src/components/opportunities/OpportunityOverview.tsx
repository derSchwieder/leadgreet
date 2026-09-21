import type { ReactNode } from "react";
import { NextStepActivityCapture } from "@/components/activities/NextStepActivityCapture";
import { NextStepTodoCapture } from "@/components/todos/NextStepTodoCapture";
import { EmailDraftPanel } from "@/components/email/EmailDraftPanel";
import { AddToCrmButton } from "@/components/opportunities/AddToCrmButton";
import { OpportunityStatusControl } from "@/components/opportunities/OpportunityStatusControl";
import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { TodoPanel } from "@/components/todos/TodoPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { displayStoredText } from "@/lib/display-copy";
import { formatEnum } from "@/lib/format";
import { NEXT_STEP_LABELS } from "@/lib/intelligence";
import type { IntelligenceNextStep } from "@/lib/intelligence";
import type { EmailDraftInput } from "@/lib/email";
import type { TimelineActivity, TimelineContact, TimelineStatusChange, WorkbenchTodo } from "@/components/activities/types";

function Fact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="surface p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <div className="mt-2 min-w-0">{children}</div>
    </section>
  );
}

export function OpportunityOverview({
  whyNow,
  signal,
  businessCaseLabel,
  serviceName,
  serviceFit,
  contact,
  nextStep,
  nextStepReason,
  opportunityId,
  companyId,
  canMutate,
  status,
  emailInput,
  todos,
  activities,
  statusHistory,
  contacts,
}: {
  whyNow: string | null;
  signal: { type: string; title: string } | null;
  businessCaseLabel: string | null;
  serviceName: string | null;
  serviceFit: number | null;
  contact: {
    fullName: string;
    role: string;
    isDecisionMaker: boolean;
  } | null;
  nextStep: IntelligenceNextStep;
  nextStepReason: string;
  opportunityId: string;
  companyId: string;
  canMutate: boolean;
  status: string;
  emailInput: EmailDraftInput;
  todos: WorkbenchTodo[];
  activities: TimelineActivity[];
  statusHistory: TimelineStatusChange[];
  contacts: TimelineContact[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <Fact label="Warum jetzt?">
          {signal ? (
            <div className="mb-2 space-y-1.5">
              <SignalTypeBadge type={signal.type} />
              <p className="text-sm text-ink">{signal.title}</p>
            </div>
          ) : null}
          <p className="text-sm leading-6 text-ink-muted">
            {displayStoredText(whyNow) || "Kein aktueller Anlass hinterlegt."}
          </p>
        </Fact>

        <div className="grid gap-4 sm:grid-cols-2">
          <Fact label="Business Case">
            <p className="text-base font-medium text-ink">
              {businessCaseLabel ?? "Noch kein belastbarer Business Case."}
            </p>
          </Fact>
          <Fact label="Passender Service">
            {serviceName ? (
              <div>
                <p className="text-base font-medium text-ink">{serviceName}</p>
                {serviceFit != null ? (
                  <p className="mt-1 font-mono text-sm tabular text-accent">
                    {serviceFit} %{" "}
                    <span className="font-sans text-ink-muted">Service-Fit</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Kein passendes Angebot gefunden.</p>
            )}
          </Fact>
        </div>

        <Fact label="Ansprechpartner">
          {contact ? (
            <p className="text-sm text-ink">
              {contact.fullName}
              <span className="mt-1 block text-ink-muted">
                {formatEnum(contact.role)}
                {contact.isDecisionMaker ? " · Entscheider" : ""}
              </span>
            </p>
          ) : (
            <p className="text-sm text-ink-muted">Kein Kontakt identifiziert.</p>
          )}
        </Fact>

        <section className="surface-featured p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Nächster Schritt
          </p>
          <p className="mt-2 text-base font-medium text-ink">{NEXT_STEP_LABELS[nextStep]}</p>
          {nextStepReason ? (
            <p className="mt-1 text-sm leading-6 text-ink-muted">{nextStepReason}</p>
          ) : null}
          {canMutate ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <NextStepActivityCapture
                opportunityId={opportunityId}
                companyId={companyId}
                nextStep={nextStep}
              />
              <NextStepTodoCapture
                opportunityId={opportunityId}
                companyId={companyId}
                nextStep={nextStep}
              />
            </div>
          ) : null}
        </section>

        <div className="flex flex-wrap gap-2">
          <TodoPanel
            opportunityId={opportunityId}
            companyId={companyId}
            canMutate={canMutate}
            todos={todos}
            contacts={contacts}
            activities={activities}
            actionsOnly
          />
          <ActivityTimeline
            opportunityId={opportunityId}
            companyId={companyId}
            canMutate={canMutate}
            activities={activities}
            statusHistory={statusHistory}
            contacts={contacts}
            actionsOnly
          />
        </div>

        <EmailDraftPanel input={emailInput} />
      </div>

      <aside className="space-y-4 lg:col-span-2">
        <OpportunityStatusControl
          opportunityId={opportunityId}
          status={status}
          canMutate={canMutate}
        />
        <section className="surface p-5">
          <SectionHeading>CRM</SectionHeading>
          <AddToCrmButton opportunityId={opportunityId} />
        </section>
      </aside>
    </div>
  );
}
