"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { contactDisplayLabel } from "@/lib/contacts/display";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatDate, formatTime } from "@/lib/format";
import {
  activityOutcomeLabel,
  activityTypeLabel,
  opportunityStatusLabel,
} from "@/lib/labels";
import { ActivityForm } from "./ActivityForm";
import type { TimelineActivity, TimelineContact, TimelineStatusChange } from "./types";

type TimelineItem =
  | { kind: "activity"; at: number; activity: TimelineActivity }
  | { kind: "status"; at: number; history: TimelineStatusChange };

function contactLine(activity: TimelineActivity): string | null {
  if (!activity.contactName) return null;
  return contactDisplayLabel({
    fullName: activity.contactName,
    role: activity.contactRole,
  });
}

function CompactDetails({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs text-ink-faint">Details anzeigen</summary>
      <div className="mt-1 space-y-1">{children}</div>
    </details>
  );
}

export function ActivityTimeline({
  opportunityId,
  companyId,
  canMutate,
  activities: initialActivities,
  statusHistory: initialHistory,
  contacts,
  actionsOnly = false,
}: {
  opportunityId: string;
  companyId: string;
  canMutate: boolean;
  activities: TimelineActivity[];
  statusHistory: TimelineStatusChange[];
  contacts: TimelineContact[];
  actionsOnly?: boolean;
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [statusHistory, setStatusHistory] = useState(initialHistory);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  useEffect(() => {
    setStatusHistory(initialHistory);
  }, [initialHistory]);

  useEffect(() => {
    async function reloadWorkbench() {
      const [statusResponse, activityResponse] = await Promise.all([
        fetch(`/api/opportunities/${opportunityId}/status`),
        fetch(`/api/activities?opportunityId=${opportunityId}`),
      ]);

      if (statusResponse.ok) {
        const payload = (await statusResponse.json()) as {
          history?: TimelineStatusChange[];
        };
        if (payload.history) {
          setStatusHistory(
            payload.history.map((entry) => ({
              ...entry,
              changedAt:
                typeof entry.changedAt === "string"
                  ? entry.changedAt
                  : new Date(entry.changedAt).toISOString(),
            })),
          );
        }
      }

      if (activityResponse.ok) {
        const payload = (await activityResponse.json()) as {
          activities?: TimelineActivity[];
        };
        if (payload.activities) {
          setActivities(
            payload.activities.map((activity) => ({
              ...activity,
              occurredAt:
                typeof activity.occurredAt === "string"
                  ? activity.occurredAt
                  : new Date(activity.occurredAt).toISOString(),
            })),
          );
        }
      }
    }

    window.addEventListener("leadgreet:workbench-refresh", reloadWorkbench);
    return () => window.removeEventListener("leadgreet:workbench-refresh", reloadWorkbench);
  }, [opportunityId]);

  const activityById = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity])),
    [activities],
  );

  const items = useMemo<TimelineItem[]>(() => {
    const merged: TimelineItem[] = [
      ...activities.map((activity) => ({
        kind: "activity" as const,
        at: new Date(activity.occurredAt).getTime(),
        activity,
      })),
      ...statusHistory.map((history) => ({
        kind: "status" as const,
        at: new Date(history.changedAt).getTime(),
        history,
      })),
    ];
    return merged.sort((a, b) => b.at - a.at);
  }, [activities, statusHistory]);

  const composer = (
    <ActivityForm
      open={formOpen}
      opportunityId={opportunityId}
      companyId={companyId}
      contacts={contacts}
      activities={activities}
      onClose={() => setFormOpen(false)}
      onCreated={(activity) => {
        setActivities((current) => [activity, ...current]);
        window.dispatchEvent(new Event("leadgreet:workbench-refresh"));
      }}
    />
  );

  if (actionsOnly) {
    if (!canMutate) return null;
    return (
      <>
        <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
          + Aktivität dokumentieren
        </button>
        {composer}
      </>
    );
  }

  return (
    <section className="surface p-5">
      <SectionHeading hint="Was ist passiert?">Verlauf</SectionHeading>
      {canMutate ? (
        <div className="mb-4">
          <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>
            + Aktivität dokumentieren
          </button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Noch kein Verlauf"
          description="Dokumentieren Sie den ersten Kontakt, damit Aktion und Reaktion hier sichtbar werden."
        />
      ) : (
        <ol className="relative space-y-2.5">
          {items.map((item) => {
            if (item.kind === "status") {
              const fromLabel = item.history.fromStatus
                ? opportunityStatusLabel(item.history.fromStatus)
                : null;
              return (
                <li key={`status-${item.history.id}`} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-line-strong" />
                  <p className="text-xs tabular text-ink-muted">
                    {formatDate(item.history.changedAt)}
                    {formatTime(item.history.changedAt)
                      ? ` · ${formatTime(item.history.changedAt)}`
                      : ""}
                    {" · Statusänderung"}
                  </p>
                  <p className="mt-0.5 text-sm text-ink">
                    {fromLabel ? (
                      <>
                        {fromLabel}
                        <span className="mx-1.5 text-ink-faint">→</span>
                        {opportunityStatusLabel(item.history.toStatus)}
                      </>
                    ) : (
                      opportunityStatusLabel(item.history.toStatus)
                    )}
                  </p>
                  {item.history.note ? (
                    <CompactDetails>
                      <p className="text-sm leading-5 text-ink-muted">{item.history.note}</p>
                    </CompactDetails>
                  ) : null}
                </li>
              );
            }

            const activity = item.activity;
            const parent = activity.responseToActivityId
              ? activityById.get(activity.responseToActivityId)
              : undefined;
            const related = Boolean(activity.responseToActivityId);
            const time = formatTime(activity.occurredAt);
            const contact = contactLine(activity);
            const outcome = activity.outcome ? activityOutcomeLabel(activity.outcome) : null;
            const meta = [contact, outcome].filter(Boolean).join(" · ");
            const hasDetails = Boolean(activity.note || parent || related);

            return (
              <li
                key={`activity-${activity.id}`}
                className={`relative ${related ? "ml-4 border-l border-accent/30 pl-5" : "pl-5"}`}
              >
                <span
                  className={`absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full ${
                    related ? "-ml-[5px] bg-accent" : "bg-accent"
                  }`}
                />
                <p className="text-xs tabular text-ink-muted">
                  {formatDate(activity.occurredAt)}
                  {time ? ` · ${time}` : ""}
                  {` · ${activityTypeLabel(activity.type)}`}
                </p>
                {activity.subject ? (
                  <p className="mt-0.5 text-sm font-medium text-ink">{activity.subject}</p>
                ) : null}
                {meta ? <p className="mt-0.5 text-xs text-ink-muted">{meta}</p> : null}
                {hasDetails ? (
                  <CompactDetails>
                    {activity.note ? (
                      <p className="text-sm leading-5 text-ink-muted">{activity.note}</p>
                    ) : null}
                    {parent ? (
                      <p className="text-xs text-ink-faint">
                        Bezieht sich auf: {activityTypeLabel(parent.type)}
                        {parent.subject ? ` · ${parent.subject}` : ""}
                      </p>
                    ) : related ? (
                      <p className="text-xs text-ink-faint">Bezieht sich auf eine frühere Aktivität</p>
                    ) : null}
                  </CompactDetails>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {composer}
    </section>
  );
}
