import { isFollowUpActivity } from "@/lib/intelligence";
import type { IntelligenceNextStep } from "@/lib/intelligence";
import { NEXT_ACTION_TITLES } from "@/lib/todos/next-action";
import { HOT_OPPORTUNITY_THRESHOLD } from "@/lib/scoring";

export const TODAY_SIGNAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const TODAY_HIGH_GREET = HOT_OPPORTUNITY_THRESHOLD;
export const TODAY_MORE_LIMIT = 4;

export type TodayKind = "todo" | "follow_up" | "signal" | "next_step";

export type TodoDueState = "overdue" | "today";

export type TodayTodoInput = {
  id: string;
  title: string;
  dueAt: Date;
  status: "OPEN" | "DONE";
  companyId: string;
  companyName: string;
  opportunityId: string;
  contactId?: string | null;
};

export type TodayActivityInput = {
  id: string;
  companyId: string;
  companyName: string;
  opportunityId: string;
  occurredAt: Date;
  type: string;
  outcome: string | null;
};

export type TodayOpportunityInput = {
  id: string;
  companyId: string;
  companyName: string;
  status: string;
};

export type TodaySignalInput = {
  id: string;
  title: string;
  type: string;
  detectedAt: Date;
  companyId: string;
  companyName: string;
};

export type TodayGreetInput = {
  companyId: string;
  greet: number;
  signalTitle: string | null;
};

export type TodayCandidate = {
  companyId: string;
  companyName: string;
  opportunityId: string;
  kind: TodayKind;
  greet: number | null;
  todoId?: string;
  todoTitle?: string;
  todoDueAt?: Date;
  todoDue?: TodoDueState;
  todoContactId?: string | null;
  activityId?: string;
  activityOccurredAt?: Date;
  signalId?: string;
  signalTitle?: string;
  signalType?: string;
};

const CLOSED_OPPORTUNITY = new Set(["LOST", "DISMISSED"]);

export function isActiveOpportunityStatus(status: string): boolean {
  return !CLOSED_OPPORTUNITY.has(status);
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isDueToday(dueAt: Date, now: Date): boolean {
  return startOfLocalDay(dueAt).getTime() === startOfLocalDay(now).getTime();
}

export function isOverdueTodo(dueAt: Date, now: Date): boolean {
  return startOfLocalDay(dueAt).getTime() < startOfLocalDay(now).getTime();
}

export function isDueTodayOrOverdue(dueAt: Date, now: Date): boolean {
  return isOverdueTodo(dueAt, now) || isDueToday(dueAt, now);
}

export function todoDueState(dueAt: Date, now: Date): TodoDueState | null {
  if (isOverdueTodo(dueAt, now)) return "overdue";
  if (isDueToday(dueAt, now)) return "today";
  return null;
}

export function greetingFirstName(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first || name.trim() || "dort";
}

export function todayHeadline(
  companyName: string,
  nextStep: IntelligenceNextStep | null,
  hero: boolean,
): string {
  const action =
    nextStep === "CHECK_FOLLOW_UP"
      ? `${companyName} nachfassen`
      : nextStep === "SEND_CONTENT"
        ? `${companyName}: Inhalt senden`
        : `${companyName} kontaktieren`;
  return hero ? `Heute zuerst: ${action}` : action;
}

export function personLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? fullName.trim();
}

export function todayTopicLabel(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^\[DEMO\]\s*/i, "").trim();
  return cleaned || null;
}

export function todayRecommendation(input: {
  hero: boolean;
  kind: TodayKind;
  companyName: string;
  nextStep: IntelligenceNextStep | null;
  contactName: string | null;
  topic: string | null;
  todoTitle: string | null;
  todoDue: TodoDueState | null;
}): string {
  const prefix = recommendationPrefix(input);
  return `${prefix}${recommendationAction(input)}`;
}

export function todayResearchAction(companyName: string, topic: string | null): string {
  if (topic) return `Ansprechpartner für ${topic} bei ${companyName} recherchieren`;
  return `Ansprechpartner bei ${companyName} recherchieren`;
}

export function todayActionLabel(nextStep: IntelligenceNextStep | null): string {
  return nextStep ? NEXT_ACTION_TITLES[nextStep] : "Kontakt aufnehmen";
}

function recommendationPrefix(input: {
  hero: boolean;
  todoDue: TodoDueState | null;
  contactName: string | null;
}): string {
  if (input.hero && input.todoDue === "today") return "Heute ";
  if (input.hero && !input.contactName) return "Heute ";
  if (input.hero) return "Heute zuerst: ";
  if (input.todoDue === "today") return "Heute ";
  return "";
}

function recommendationAction(input: {
  kind: TodayKind;
  companyName: string;
  nextStep: IntelligenceNextStep | null;
  contactName: string | null;
  topic: string | null;
  todoTitle: string | null;
}): string {
  if (!input.contactName) {
    return todayResearchAction(input.companyName, input.topic);
  }

  const name = input.contactName.trim();
  const lastName = personLastName(name);

  if (input.nextStep === "SEND_CONTENT") {
    return `${name} passenden Content senden`;
  }
  if (input.todoTitle) {
    if (input.todoTitle.includes(name) || input.todoTitle.includes(lastName)) {
      return input.todoTitle;
    }
    return `${input.todoTitle} bei ${lastName} erledigen`;
  }
  if (input.nextStep === "CHECK_FOLLOW_UP") {
    return `${name} nachfassen`;
  }
  return `${name} kontaktieren`;
}

export function latestActivityByCompany(
  activities: readonly TodayActivityInput[],
): Map<string, TodayActivityInput> {
  const latest = new Map<string, TodayActivityInput>();
  for (const activity of activities) {
    const previous = latest.get(activity.companyId);
    if (!previous || activity.occurredAt.getTime() > previous.occurredAt.getTime()) {
      latest.set(activity.companyId, activity);
    }
  }
  return latest;
}

export function pickTodayPriorities(input: {
  now: Date;
  todos: readonly TodayTodoInput[];
  activities: readonly TodayActivityInput[];
  opportunities: readonly TodayOpportunityInput[];
  signals: readonly TodaySignalInput[];
  greets: ReadonlyMap<string, TodayGreetInput>;
}): { hero: TodayCandidate | null; more: TodayCandidate[] } {
  const activeOpp = new Map(
    input.opportunities
      .filter((row) => isActiveOpportunityStatus(row.status))
      .map((row) => [row.companyId, row]),
  );
  const greetOf = (companyId: string): number | null => input.greets.get(companyId)?.greet ?? null;

  const todoCandidates = input.todos
    .filter((todo) => todo.status === "OPEN" && activeOpp.has(todo.companyId))
    .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime());

  const overdueTodos = todoCandidates.filter((todo) => isOverdueTodo(todo.dueAt, input.now));
  const dueTodayTodos = todoCandidates.filter((todo) => isDueToday(todo.dueAt, input.now));
  const dueTodos = todoCandidates.filter((todo) => isDueTodayOrOverdue(todo.dueAt, input.now));

  const followUps = [...latestActivityByCompany(input.activities).values()]
    .filter(
      (activity) =>
        activeOpp.has(activity.companyId) && isFollowUpActivity(activity.type, activity.outcome),
    )
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());

  const weekAgo = input.now.getTime() - TODAY_SIGNAL_WINDOW_MS;
  const signalCandidates = input.signals
    .filter((signal) => {
      if (signal.detectedAt.getTime() < weekAgo) return false;
      if (!activeOpp.has(signal.companyId)) return false;
      const greet = greetOf(signal.companyId);
      return greet != null && greet >= TODAY_HIGH_GREET;
    })
    .sort((left, right) => {
      const greetDelta = (greetOf(right.companyId) ?? 0) - (greetOf(left.companyId) ?? 0);
      if (greetDelta !== 0) return greetDelta;
      return right.detectedAt.getTime() - left.detectedAt.getTime();
    });

  const nextStepCandidates = [...activeOpp.values()]
    .map((opportunity) => ({
      opportunity,
      greet: greetOf(opportunity.companyId),
    }))
    .sort((left, right) => (right.greet ?? -1) - (left.greet ?? -1));

  const hero =
    toTodoCandidate(overdueTodos[0], greetOf, input.now) ??
    toTodoCandidate(dueTodayTodos[0], greetOf, input.now) ??
    toFollowUpCandidate(followUps[0], greetOf, activeOpp) ??
    toSignalCandidate(signalCandidates[0], greetOf, activeOpp);

  const used = new Set<string>();
  if (hero) used.add(hero.companyId);

  const more: TodayCandidate[] = [];
  const pushUnique = (candidate: TodayCandidate | null) => {
    if (!candidate || used.has(candidate.companyId) || more.length >= TODAY_MORE_LIMIT) return;
    used.add(candidate.companyId);
    more.push(candidate);
  };

  for (const todo of dueTodos) {
    pushUnique(toTodoCandidate(todo, greetOf, input.now));
  }
  for (const activity of followUps) {
    pushUnique(toFollowUpCandidate(activity, greetOf, activeOpp));
  }
  for (const signal of signalCandidates) {
    pushUnique(toSignalCandidate(signal, greetOf, activeOpp));
  }
  for (const row of nextStepCandidates) {
    pushUnique({
      companyId: row.opportunity.companyId,
      companyName: row.opportunity.companyName,
      opportunityId: row.opportunity.id,
      kind: "next_step",
      greet: row.greet,
    });
  }

  if (!hero && more.length > 0) {
    const [promoted, ...rest] = more;
    return { hero: promoted ?? null, more: rest };
  }

  return { hero, more };
}

function toTodoCandidate(
  todo: TodayTodoInput | undefined,
  greetOf: (companyId: string) => number | null,
  now: Date,
): TodayCandidate | null {
  if (!todo) return null;
  return {
    companyId: todo.companyId,
    companyName: todo.companyName,
    opportunityId: todo.opportunityId,
    kind: "todo",
    greet: greetOf(todo.companyId),
    todoId: todo.id,
    todoTitle: todo.title,
    todoDueAt: todo.dueAt,
    todoDue: todoDueState(todo.dueAt, now) ?? "overdue",
    todoContactId: todo.contactId ?? null,
  };
}

function toFollowUpCandidate(
  activity: TodayActivityInput | undefined,
  greetOf: (companyId: string) => number | null,
  opportunities: Map<string, TodayOpportunityInput>,
): TodayCandidate | null {
  if (!activity) return null;
  const opportunity = opportunities.get(activity.companyId);
  if (!opportunity) return null;
  return {
    companyId: activity.companyId,
    companyName: activity.companyName,
    opportunityId: opportunity.id,
    kind: "follow_up",
    greet: greetOf(activity.companyId),
    activityId: activity.id,
    activityOccurredAt: activity.occurredAt,
  };
}

function toSignalCandidate(
  signal: TodaySignalInput | undefined,
  greetOf: (companyId: string) => number | null,
  opportunities: Map<string, TodayOpportunityInput>,
): TodayCandidate | null {
  if (!signal) return null;
  const opportunity = opportunities.get(signal.companyId);
  if (!opportunity) return null;
  return {
    companyId: signal.companyId,
    companyName: signal.companyName,
    opportunityId: opportunity.id,
    kind: "signal",
    greet: greetOf(signal.companyId),
    signalId: signal.id,
    signalTitle: signal.title,
    signalType: signal.type,
  };
}
