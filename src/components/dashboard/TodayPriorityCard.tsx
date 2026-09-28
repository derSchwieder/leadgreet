import Link from "next/link";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { ArrowRightIcon } from "@/components/icons/LeadgreetIcons";
import { opportunityDetailPath } from "@/lib/opportunities/path";
import type { TodayPriorityView } from "@/lib/dashboard/today-view";
import { CompleteTodoButton } from "./CompleteTodoButton";
import { todayKindLabel } from "./today-presentation";
import { TodayKindIcon } from "./TodayKindIcon";

export function TodayPriorityCard({ card }: { card: TodayPriorityView }) {
  const opportunityHref = opportunityDetailPath(card.opportunityId);

  return (
    <article className="surface-featured px-6 py-8 sm:px-8" aria-label={card.headline}>
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
        <TodayKindIcon kind={card.kind} featured />
        Heute zuerst
      </p>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <Link
          href={`/companies/${card.companyId}`}
          className="inline-flex min-w-0 max-w-full items-center gap-3 text-ink hover:text-accent"
        >
          <CompanyLogo name={card.companyName} size="md" />
          <h2 className="truncate text-[1.65rem] font-semibold leading-tight tracking-tight">
            {card.companyName}
          </h2>
        </Link>
        {card.greet != null ? (
          <p className="shrink-0 pt-1 font-mono text-sm tabular text-accent" data-score-kind="greet">
            <span className="mr-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Greet
            </span>
            {card.greet}
          </p>
        ) : null}
      </div>

      {card.kind === "todo" ? (
        <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
          {todayKindLabel(card)}
        </p>
      ) : null}
      {card.occasion ? (
        <p className={`max-w-2xl text-sm leading-6 text-ink ${card.kind === "todo" ? "mt-2" : "mt-5"}`}>
          {card.occasion}
        </p>
      ) : null}
      {card.reason ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{card.reason}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={opportunityHref} className="btn-primary inline-flex items-center gap-2">
          {card.nextActionTitle ?? "Kontakt aufnehmen"}
          <ArrowRightIcon size={16} />
        </Link>
        {card.todoId ? <CompleteTodoButton todoId={card.todoId} variant="inline" /> : null}
      </div>
    </article>
  );
}
