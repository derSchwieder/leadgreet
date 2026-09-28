import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/LeadgreetIcons";
import { opportunityDetailPath } from "@/lib/opportunities/path";
import type { TodayPriorityView } from "@/lib/dashboard/today-view";
import { CompleteTodoButton } from "./CompleteTodoButton";
import { compactTodayActionLabel, todayKindLabel } from "./today-presentation";
import { TodayKindIcon } from "./TodayKindIcon";

export function TodayPriorityRow({ card }: { card: TodayPriorityView }) {
  const opportunityHref = opportunityDetailPath(card.opportunityId);
  const typeLabel = todayKindLabel(card);
  const actionLabel = compactTodayActionLabel(card);

  return (
    <li className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-canvas-hover/70 sm:gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-accent" title={typeLabel}>
        <TodayKindIcon kind={card.kind} />
        <span className="sr-only">{typeLabel}</span>
      </span>

      <Link
        href={`/companies/${card.companyId}`}
        className="w-36 shrink-0 truncate text-sm font-medium text-ink hover:text-accent sm:w-48"
      >
        {card.companyName}
      </Link>

      <p className="hidden min-w-0 flex-1 truncate text-sm text-ink-muted sm:block">{typeLabel}</p>

      {card.kind === "todo" && card.todoId ? (
        <CompleteTodoButton todoId={card.todoId} variant="row" label={actionLabel} />
      ) : (
        <Link
          href={opportunityHref}
          className="inline-flex shrink-0 items-center justify-end gap-1 text-sm font-medium text-accent hover:text-[#3ad7be]"
        >
          {actionLabel}
          <ArrowRightIcon size={14} />
        </Link>
      )}
    </li>
  );
}
