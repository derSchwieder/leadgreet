import type { IntelligenceNextStep } from "@/lib/intelligence";
import type { NextActionSuggestion } from "@/lib/todos/next-action";
import type { TodayKind, TodoDueState } from "./today";

export type TodayPriorityView = {
  companyId: string;
  companyName: string;
  opportunityId: string;
  kind: TodayKind;
  headline: string;
  greet: number | null;
  occasion: string | null;
  reason: string | null;
  nextStep: IntelligenceNextStep | null;
  nextActionTitle: string | null;
  channelLabel: string | null;
  todoId: string | null;
  todoTitle: string | null;
  todoDue: TodoDueState | null;
  contactName: string | null;
};

export type TodayCockpitView = {
  hero: TodayPriorityView | null;
  more: TodayPriorityView[];
  nextActions: Record<string, NextActionSuggestion | null>;
};
