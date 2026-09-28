import { getCompanyGreet } from "./company-greet";
import { getContactById } from "./contacts";
import { getCompanyIntelligence } from "./intelligence";
import { listActivities } from "./activities";
import { listOpportunities } from "./opportunities";
import { listRadarPoints } from "./radar";
import { listSalesTodos } from "./todos";
import { prisma } from "./client";
import { SIGNAL_CATEGORY_LABELS_DE, SIGNAL_TYPE_LABELS } from "@/lib/labels";
import { SIGNAL_TYPE_CATEGORY, type SignalType } from "@/types";
import {
  pickTodayPriorities,
  todayActionLabel,
  todayRecommendation,
  todayResearchAction,
  todayTopicLabel,
  TODAY_SIGNAL_WINDOW_MS,
  type TodayActivityInput,
  type TodayCandidate,
  type TodayGreetInput,
  type TodayOpportunityInput,
  type TodaySignalInput,
  type TodayTodoInput,
} from "@/lib/dashboard/today";
import type { TodayCockpitView, TodayPriorityView } from "@/lib/dashboard/today-view";
import { buildNextAction, type NextActionContact } from "@/lib/todos/next-action";
import type { IntelligenceNextStep } from "@/lib/intelligence";

export async function getTodayCockpit(
  accountId: string,
  now: Date = new Date(),
): Promise<TodayCockpitView> {
  const weekAgo = new Date(now.getTime() - TODAY_SIGNAL_WINDOW_MS);
  const [todos, activities, opportunities, radarPoints, recentSignals] = await Promise.all([
    listSalesTodos(accountId),
    listActivities(accountId),
    listOpportunities(accountId),
    listRadarPoints(accountId),
    prisma.signal.findMany({
      where: {
        detectedAt: { gte: weekAgo },
        status: { not: "DISMISSED" },
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { detectedAt: "desc" },
      take: 24,
    }),
  ]);

  const opportunityById = new Map(opportunities.map((row) => [row.id, row]));
  const opportunityByCompany = new Map(opportunities.map((row) => [row.companyId, row]));

  const todoInputs: TodayTodoInput[] = todos.flatMap((todo) => {
    const opportunity = opportunityById.get(todo.opportunityId);
    if (!opportunity) return [];
    return [
      {
        id: todo.id,
        title: todo.title,
        dueAt: todo.dueAt,
        status: todo.status,
        companyId: todo.companyId,
        companyName: opportunity.company.name,
        opportunityId: todo.opportunityId,
        contactId: todo.contactId,
      },
    ];
  });

  const activityInputs: TodayActivityInput[] = activities.flatMap((activity) => {
    const opportunity = opportunityById.get(activity.opportunityId);
    if (!opportunity) return [];
    return [
      {
        id: activity.id,
        companyId: activity.companyId,
        companyName: opportunity.company.name,
        opportunityId: activity.opportunityId,
        occurredAt: activity.occurredAt,
        type: activity.type,
        outcome: activity.outcome,
      },
    ];
  });

  const opportunityInputs: TodayOpportunityInput[] = opportunities.map((row) => ({
    id: row.id,
    companyId: row.companyId,
    companyName: row.company.name,
    status: row.status,
  }));

  const signalInputs: TodaySignalInput[] = recentSignals.map((signal) => ({
    id: signal.id,
    title: signal.title,
    type: signal.type,
    detectedAt: signal.detectedAt,
    companyId: signal.companyId,
    companyName: signal.company.name,
  }));

  const greets = new Map<string, TodayGreetInput>(
    radarPoints.map((point) => [
      point.companyId,
      { companyId: point.companyId, greet: point.greet, signalTitle: point.signalTitle },
    ]),
  );

  const picked = pickTodayPriorities({
    now,
    todos: todoInputs,
    activities: activityInputs,
    opportunities: opportunityInputs,
    signals: signalInputs,
    greets,
  });

  const selected = [picked.hero, ...picked.more].filter((row): row is TodayCandidate => row != null);
  const selectedIds = selected.map((row) => row.companyId);

  const todoContactIds = [
    ...new Set(
      selected
        .map((row) => row.todoContactId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [intelligenceRows, greetFallbacks, todoContacts] = await Promise.all([
    Promise.all(selectedIds.map((companyId) => getCompanyIntelligence(companyId, accountId))),
    Promise.all(
      selected
        .filter((row) => row.greet == null)
        .map(async (row) => {
          const scored = await getCompanyGreet(row.companyId, now);
          return [row.companyId, scored.opportunityScore] as const;
        }),
    ),
    Promise.all(
      todoContactIds.map(async (id) => {
        try {
          const contact = await getContactById(id);
          return [id, contact.fullName] as const;
        } catch {
          return [id, null] as const;
        }
      }),
    ),
  ]);

  const intelligenceByCompany = new Map(intelligenceRows.map((row) => [row.company.id, row]));
  const todoContactNameById = new Map(todoContacts);
  const liveGreetByCompany = new Map(greets);
  for (const [companyId, greet] of greetFallbacks) {
    liveGreetByCompany.set(companyId, {
      companyId,
      greet,
      signalTitle: liveGreetByCompany.get(companyId)?.signalTitle ?? null,
    });
  }

  const nextActions: TodayCockpitView["nextActions"] = {};

  function toView(candidate: TodayCandidate, hero: boolean): TodayPriorityView {
    const intelligence = intelligenceByCompany.get(candidate.companyId) ?? null;
    const opportunity = opportunityByCompany.get(candidate.companyId);
    const nextStep = (intelligence?.nextStep ?? null) as IntelligenceNextStep | null;
    const contact = contactForAction(opportunity?.recommendedContact ?? null, intelligence?.matchingContact ?? null);
    const allowed = [contact?.id, intelligence?.matchingContact?.id].filter((id): id is string => Boolean(id));
    const nextAction = buildNextAction({
      nextStep,
      contact,
      allowedContactIds: allowed,
    });
    nextActions[candidate.companyId] = nextAction;

    const liveGreet = liveGreetByCompany.get(candidate.companyId)?.greet ?? candidate.greet;
    const radarSignal = liveGreetByCompany.get(candidate.companyId)?.signalTitle ?? null;
    const topic = todayTopicLabel(
      candidate.signalTitle ?? intelligence?.triggerSignal?.title ?? radarSignal,
    );
    const contactName = resolveContactName(
      candidate.todoContactId ?? null,
      todoContactNameById.get(candidate.todoContactId ?? "") ?? null,
      nextAction?.contact?.fullName ?? null,
      opportunity?.recommendedContact?.fullName ?? null,
      intelligence?.matchingContact?.fullName ?? null,
    );
    const headline = todayRecommendation({
      hero,
      kind: candidate.kind,
      companyName: candidate.companyName,
      nextStep,
      contactName,
      topic,
      todoTitle: candidate.todoTitle ?? null,
      todoDue: candidate.todoDue ?? null,
    });

    return {
      companyId: candidate.companyId,
      companyName: candidate.companyName,
      opportunityId: candidate.opportunityId,
      kind: candidate.kind,
      headline,
      greet: liveGreet,
      occasion: occasionLabel(candidate, radarSignal, headline),
      reason: intelligence?.nextStepReason ?? null,
      nextStep,
      nextActionTitle: contactName
        ? (nextAction?.title ?? todayActionLabel(nextStep))
        : todayResearchAction(candidate.companyName, topic),
      channelLabel: nextAction?.channel.label ?? null,
      todoId: candidate.todoId ?? null,
      todoTitle: candidate.todoTitle ?? null,
      todoDue: candidate.todoDue ?? null,
      contactName,
    };
  }

  return {
    hero: picked.hero ? toView(picked.hero, true) : null,
    more: picked.more.map((row) => toView(row, false)),
    nextActions,
  };
}

function contactForAction(
  recommended: { id: string; fullName: string; role: string; email: string | null } | null,
  matching: { id: string; fullName: string; role: string; email: string | null } | null,
): NextActionContact | null {
  const source = recommended ?? matching;
  if (!source) return null;
  return {
    id: source.id,
    fullName: source.fullName,
    role: source.role,
    email: source.email,
    phone: null,
    linkedinUrl: null,
  };
}

function resolveContactName(
  todoContactId: string | null,
  todoContactName: string | null,
  nextActionName: string | null,
  recommendedName: string | null,
  matchingName: string | null,
): string | null {
  if (todoContactId) return todoContactName;
  return nextActionName ?? recommendedName ?? matchingName;
}

function occasionLabel(
  candidate: TodayCandidate,
  radarSignal: string | null,
  headline: string,
): string | null {
  if (candidate.kind === "todo" || candidate.kind === "next_step") {
    return headline.replace(/^Heute zuerst:\s*/, "").replace(/^Heute\s+/, "");
  }
  if (candidate.signalTitle) {
    return signalOccasion(candidate.signalType, candidate.signalTitle);
  }
  if (candidate.kind === "follow_up") return "Follow-up nach letzter Aktivität";
  if (radarSignal) return radarSignal;
  return headline.replace(/^Heute zuerst:\s*/, "").replace(/^Heute\s+/, "") || null;
}

function signalOccasion(type: string | undefined, title: string): string {
  if (!type) return title;
  const category = SIGNAL_TYPE_CATEGORY[type as SignalType];
  const categoryLabel = category ? SIGNAL_CATEGORY_LABELS_DE[category] : null;
  const typeLabel = SIGNAL_TYPE_LABELS[type];
  if (category === "AI") {
    return `Neues KI-Signal: ${title}`;
  }
  return `${categoryLabel ?? typeLabel ?? type}: ${title}`;
}
