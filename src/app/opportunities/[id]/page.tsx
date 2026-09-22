import Link from "next/link";
import { notFound } from "next/navigation";
import { OpportunityActivities } from "@/components/opportunities/OpportunityActivities";
import { OpportunityContacts } from "@/components/opportunities/OpportunityContacts";
import { OpportunityGreetelligence } from "@/components/opportunities/OpportunityGreetelligence";
import { OpportunityOverview } from "@/components/opportunities/OpportunityOverview";
import { OpportunityTabs } from "@/components/opportunities/OpportunityTabs";
import { CompanyName } from "@/components/ui/CompanyName";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { GreetChanceScores, toOpportunityHeaderScores } from "@/components/ui/GreetChanceScores";
import { SetupState } from "@/components/ui/SetupState";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { listActivities } from "@/lib/db/activities";
import { listContacts } from "@/lib/db/contacts";
import { getCompanyGreet } from "@/lib/db/company-greet";
import { getCompanyIntelligence } from "@/lib/db/intelligence";
import { getRecommendations } from "@/lib/db/recommendations";
import { getDatabaseGate } from "@/lib/db/status";
import { getOpportunityById } from "@/lib/db/opportunities";
import { listStatusHistory } from "@/lib/db/opportunity-status-history";
import { isMissingSalesTodoTable, listSalesTodos } from "@/lib/db/todos";
import { NotFoundError } from "@/lib/db/serialize";
import { toEmailDraftInput } from "@/lib/email";
import { displayOpportunityTitle } from "@/lib/display-copy";
import { toBusinessCasePresentation } from "@/components/recommendations/business-case-view";
import { partitionRecommendations } from "@/components/recommendations/partition";
import type { RecommendationResult } from "@/lib/recommendation";

function toIso(value: Date | string): string {
  return new Date(value).toISOString();
}

const EMPTY_RECOMMENDATIONS: RecommendationResult = {
  primaryRecommendation: null,
  alternativeRecommendations: [],
  recommendations: [],
  businessCases: [],
  primaryBusinessCase: null,
};

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const { id } = await params;

  try {
    const accountId = await getCurrentAccountId();
    const opportunity = await getOpportunityById(id, accountId);
    const canMutate = opportunity.accountId === accountId;

    const [activities, contacts, statusHistory, recommendationResult, intelligence, todos, companyGreet] =
      await Promise.all([
        canMutate ? listActivities(accountId, opportunity.id) : Promise.resolve([]),
        listContacts({ companyId: opportunity.company.id }),
        canMutate ? listStatusHistory(accountId, opportunity.id) : Promise.resolve([]),
        canMutate ? getRecommendations(accountId, opportunity.id) : Promise.resolve(EMPTY_RECOMMENDATIONS),
        getCompanyIntelligence(opportunity.company.id, accountId),
        canMutate
          ? listSalesTodos(accountId, opportunity.id).catch((error) => {
              if (isMissingSalesTodoTable(error)) return [];
              throw error;
            })
          : Promise.resolve([]),
        getCompanyGreet(opportunity.company.id).catch((error) => {
          if (error instanceof NotFoundError) return null;
          throw error;
        }),
      ]);
    const headerScores = toOpportunityHeaderScores({
      companyGreetScore: companyGreet?.opportunityScore,
      opportunityScore: opportunity.opportunityScore,
    });

    const contactNames = new Map(contacts.map((contact) => [contact.id, contact.fullName]));
    const contactRoles = new Map(contacts.map((contact) => [contact.id, contact.role]));
    const timelineContacts = contacts.map((contact) => ({
      id: contact.id,
      fullName: contact.fullName,
      role: contact.role,
    }));
    const nextActionContactId =
      opportunity.recommendedContactId ?? intelligence.matchingContact?.id ?? null;
    const nextActionSource = nextActionContactId
      ? contacts.find((contact) => contact.id === nextActionContactId)
      : undefined;
    const nextActionContact = nextActionSource
      ? {
          id: nextActionSource.id,
          fullName: nextActionSource.fullName,
          role: nextActionSource.role,
          email: nextActionSource.email,
          phone: nextActionSource.phone,
          linkedinUrl: nextActionSource.linkedinUrl,
        }
      : null;
    const timelineActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      subject: activity.subject,
      note: activity.note,
      occurredAt: toIso(activity.occurredAt),
      outcome: activity.outcome,
      contactId: activity.contactId,
      contactName: activity.contactId ? (contactNames.get(activity.contactId) ?? null) : null,
      contactRole: activity.contactId ? (contactRoles.get(activity.contactId) ?? null) : null,
      responseToActivityId: activity.responseToActivityId,
    }));
    const workbenchTodos = todos.map((todo) => ({
      id: todo.id,
      title: todo.title,
      dueAt: toIso(todo.dueAt),
      status: todo.status,
      completedAt: todo.completedAt ? toIso(todo.completedAt) : null,
      contactId: todo.contactId,
      contactName: todo.contactId ? (contactNames.get(todo.contactId) ?? null) : null,
      contactRole: todo.contactId ? (contactRoles.get(todo.contactId) ?? null) : null,
      relatedActivityId: todo.relatedActivityId,
    }));
    const timelineStatus = statusHistory.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      note: entry.note,
      changedAt: toIso(entry.changedAt),
    }));
    const { primaries, alternatives } = partitionRecommendations(recommendationResult);
    const presentation = toBusinessCasePresentation(
      recommendationResult,
      opportunity.signals.map((signal) => ({
        title: signal.title,
        type: signal.type,
        detectedAt: signal.detectedAt,
      })),
    );
    const primaryCase = presentation.cases[0] ?? null;
    const primaryService = primaries[0] ?? null;
    const trigger = intelligence.triggerSignal ?? opportunity.signals[0] ?? null;
    const emailInput = toEmailDraftInput({
      companyName: opportunity.company.name,
      recommendedContact: opportunity.recommendedContact
        ? {
            firstName: opportunity.recommendedContact.firstName,
            lastName: opportunity.recommendedContact.lastName,
            fullName: opportunity.recommendedContact.fullName,
            email: opportunity.recommendedContact.email,
            role: opportunity.recommendedContact.role,
          }
        : null,
      recommendation: recommendationResult,
      signals: opportunity.signals.map((signal) => ({
        type: signal.type,
        title: signal.title,
      })),
      activities: activities.map((activity) => ({
        type: activity.type,
        outcome: activity.outcome,
      })),
    });

    return (
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
          <Link href="/opportunities" className="hover:text-accent">
            Chancen
          </Link>
        </p>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div className="space-y-3">
            <CompanyName id={opportunity.company.id} name={opportunity.company.name} size="md" />
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-ink">
              {displayOpportunityTitle(opportunity.title)}
              {opportunity.isSeed ? <DemoBadge /> : null}
            </h1>
          </div>
          <GreetChanceScores greet={headerScores.greet} chance={headerScores.chance} />
        </header>

        <OpportunityTabs
          overview={
            <OpportunityOverview
              whyNow={opportunity.whyNow}
              signal={trigger ? { type: String(trigger.type), title: trigger.title } : null}
              businessCaseLabel={primaryCase?.label ?? null}
              serviceName={primaryService?.name ?? primaryCase?.serviceName ?? null}
              serviceFit={primaryService?.matchScore ?? primaryCase?.serviceFit ?? null}
              contact={
                opportunity.recommendedContact
                  ? {
                      fullName: opportunity.recommendedContact.fullName,
                      role: opportunity.recommendedContact.role,
                      isDecisionMaker: opportunity.recommendedContact.isDecisionMaker,
                    }
                  : null
              }
              nextStep={intelligence.nextStep}
              nextStepReason={intelligence.nextStepReason}
              opportunityId={opportunity.id}
              companyId={opportunity.company.id}
              canMutate={canMutate}
              status={opportunity.status}
              emailInput={emailInput}
              todos={workbenchTodos}
              activities={timelineActivities}
              statusHistory={timelineStatus}
              contacts={timelineContacts}
            />
          }
          greetelligence={
            <OpportunityGreetelligence
              chance={opportunity.opportunityScore}
              whyNow={opportunity.whyNow}
              presentation={presentation}
              primaries={primaries}
              alternatives={alternatives}
              recommendedApproach={opportunity.recommendedApproach}
              intelligence={intelligence}
              signals={opportunity.signals.map((signal) => ({
                id: signal.id,
                type: signal.type,
                title: signal.title,
                detectedAt: signal.detectedAt,
                signalStrength: signal.signalStrength,
                sourceName: signal.sourceName,
                sourceUrl: signal.sourceUrl,
                sourceType: signal.sourceType,
              }))}
              scores={{
                signalStrength: opportunity.signalStrength,
                freshness: opportunity.freshness,
                companyFit: opportunity.companyFit,
                contactFit: opportunity.contactFit,
                confidence: opportunity.confidence,
              }}
              explanation={opportunity.scoreBreakdown?.explanation ?? null}
            />
          }
          activities={
            <OpportunityActivities
              opportunityId={opportunity.id}
              companyId={opportunity.company.id}
              canMutate={canMutate}
              todos={workbenchTodos}
              activities={timelineActivities}
              statusHistory={timelineStatus}
              contacts={timelineContacts}
              nextStep={intelligence.nextStep}
              nextActionContact={nextActionContact}
            />
          }
          contacts={
            <OpportunityContacts
              companyId={opportunity.company.id}
              canMutate={canMutate}
              recommendedContactId={opportunity.recommendedContactId}
              contacts={contacts.map((contact) => ({
                id: contact.id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                fullName: contact.fullName,
                role: contact.role,
                isDecisionMaker: contact.isDecisionMaker,
                email: contact.email,
                phone: contact.phone,
                linkedinUrl: contact.linkedinUrl,
                department: contact.department,
                notes: contact.notes,
                isSeed: contact.isSeed,
              }))}
            />
          }
        />
      </div>
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}
