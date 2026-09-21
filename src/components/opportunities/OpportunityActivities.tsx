import { ActivityTimeline } from "@/components/activities/ActivityTimeline";
import { TodoPanel } from "@/components/todos/TodoPanel";
import type {
  TimelineActivity,
  TimelineContact,
  TimelineStatusChange,
  WorkbenchTodo,
} from "@/components/activities/types";
import type { IntelligenceNextStep } from "@/lib/intelligence";
import type { NextActionContact } from "@/lib/todos/next-action";

export function OpportunityActivities({
  opportunityId,
  companyId,
  canMutate,
  todos,
  activities,
  statusHistory,
  contacts,
  nextStep = null,
  nextActionContact = null,
}: {
  opportunityId: string;
  companyId: string;
  canMutate: boolean;
  todos: WorkbenchTodo[];
  activities: TimelineActivity[];
  statusHistory: TimelineStatusChange[];
  contacts: TimelineContact[];
  nextStep?: IntelligenceNextStep | null;
  nextActionContact?: NextActionContact | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(16rem,3fr)]">
      <div className="order-2 min-w-0 lg:order-1">
        <ActivityTimeline
          opportunityId={opportunityId}
          companyId={companyId}
          canMutate={canMutate}
          activities={activities}
          statusHistory={statusHistory}
          contacts={contacts}
        />
      </div>
      <div className="order-1 min-w-0 lg:order-2">
        <TodoPanel
          opportunityId={opportunityId}
          companyId={companyId}
          canMutate={canMutate}
          todos={todos}
          contacts={contacts}
          activities={activities}
          nextStep={nextStep}
          nextActionContact={nextActionContact}
        />
      </div>
    </div>
  );
}
