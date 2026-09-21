"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { contactDisplayLabel } from "@/lib/contacts/display";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NextActionCard } from "@/components/todos/NextActionCard";
import { formatDate, formatTime } from "@/lib/format";
import { activityTypeLabel } from "@/lib/labels";
import type { TimelineActivity, TimelineContact, WorkbenchTodo } from "@/components/activities/types";
import type { IntelligenceNextStep } from "@/lib/intelligence";
import {
  buildNextAction,
  todoDraftFromNextAction,
  type NextActionContact,
  type NextActionDraft,
} from "@/lib/todos/next-action";

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint";
const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function toDueAt(date: string, time: string): string {
  if (time) {
    return new Date(`${date}T${time}`).toISOString();
  }
  return new Date(`${date}T00:00:00`).toISOString();
}

function toWorkbenchTodos(payload: unknown): WorkbenchTodo[] {
  if (!payload || typeof payload !== "object" || !("todos" in payload)) return [];
  const todos = (payload as { todos?: unknown }).todos;
  if (!Array.isArray(todos)) return [];
  return todos.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const todo = item as {
      id?: unknown;
      title?: unknown;
      dueAt?: unknown;
      status?: unknown;
      completedAt?: unknown;
      contactId?: unknown;
      contactName?: unknown;
      contactRole?: unknown;
      relatedActivityId?: unknown;
    };
    if (typeof todo.id !== "string" || typeof todo.title !== "string") return [];
    const dueAt =
      typeof todo.dueAt === "string" ? todo.dueAt : new Date(String(todo.dueAt ?? "")).toISOString();
    return [
      {
        id: todo.id,
        title: todo.title,
        dueAt,
        status: typeof todo.status === "string" ? todo.status : "OPEN",
        completedAt:
          todo.completedAt == null
            ? null
            : typeof todo.completedAt === "string"
              ? todo.completedAt
              : new Date(String(todo.completedAt)).toISOString(),
        contactId: typeof todo.contactId === "string" ? todo.contactId : null,
        contactName: typeof todo.contactName === "string" ? todo.contactName : null,
        contactRole: typeof todo.contactRole === "string" ? todo.contactRole : null,
        relatedActivityId: typeof todo.relatedActivityId === "string" ? todo.relatedActivityId : null,
      },
    ];
  });
}

export function TodoPanel({
  opportunityId,
  companyId,
  canMutate,
  todos: initialTodos,
  contacts,
  activities,
  actionsOnly = false,
  nextStep = null,
  nextActionContact = null,
}: {
  opportunityId: string;
  companyId: string;
  canMutate: boolean;
  todos: WorkbenchTodo[];
  contacts: TimelineContact[];
  activities: TimelineActivity[];
  actionsOnly?: boolean;
  nextStep?: IntelligenceNextStep | null;
  nextActionContact?: NextActionContact | null;
}) {
  const titleId = useId();
  const [todos, setTodos] = useState(initialTodos);
  const [availableContacts, setAvailableContacts] = useState(contacts);
  const [formOpen, setFormOpen] = useState(false);
  const [formDraft, setFormDraft] = useState<NextActionDraft | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayInputValue);
  const [time, setTime] = useState("");
  const [contactId, setContactId] = useState("");
  const [relatedActivityId, setRelatedActivityId] = useState("");
  const [pending, setPending] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

  useEffect(() => {
    setAvailableContacts(contacts);
  }, [contacts]);

  useEffect(() => {
    async function reloadTodos() {
      const [todoResponse, contactResponse] = await Promise.all([
        fetch(`/api/todos?opportunityId=${opportunityId}`),
        fetch(`/api/contacts?companyId=${encodeURIComponent(companyId)}`),
      ]);
      if (todoResponse.ok) {
        const payload: unknown = await todoResponse.json();
        setTodos(toWorkbenchTodos(payload));
      }
      if (contactResponse.ok) {
        const payload: unknown = await contactResponse.json();
        if (payload && typeof payload === "object" && "contacts" in payload) {
          const next = (payload as { contacts?: unknown }).contacts;
          if (Array.isArray(next)) {
            setAvailableContacts(
              next.flatMap((item) => {
                if (!item || typeof item !== "object") return [];
                const contact = item as { id?: unknown; fullName?: unknown; role?: unknown };
                if (typeof contact.id !== "string" || typeof contact.fullName !== "string") {
                  return [];
                }
                return [
                  {
                    id: contact.id,
                    fullName: contact.fullName,
                    role: typeof contact.role === "string" ? contact.role : null,
                  },
                ];
              }),
            );
          }
        }
      }
    }

    window.addEventListener("leadgreet:workbench-refresh", reloadTodos);
    return () => window.removeEventListener("leadgreet:workbench-refresh", reloadTodos);
  }, [opportunityId, companyId]);

  const parentOptions = useMemo(
    () =>
      [...activities].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    [activities],
  );

  const openTodos = todos.filter((todo) => todo.status !== "DONE");
  const doneTodos = todos.filter((todo) => todo.status === "DONE");
  const suggestion = useMemo(
    () =>
      buildNextAction({
        nextStep,
        contact: nextActionContact,
        allowedContactIds: availableContacts.map((contact) => contact.id),
      }),
    [nextStep, nextActionContact, availableContacts],
  );

  function openTodoForm(draft: NextActionDraft | null) {
    setFormDraft(draft);
    setTitle(draft?.title ?? "");
    setDate(todayInputValue());
    setTime("");
    setContactId(draft?.contactId ?? "");
    setRelatedActivityId("");
    setError(null);
    setPending(false);
    setFormOpen(true);
  }

  function openOwnTodo() {
    openTodoForm(null);
  }

  function openSuggestion() {
    if (!suggestion) return;
    openTodoForm(todoDraftFromNextAction(suggestion));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          companyId,
          title: title.trim(),
          dueAt: toDueAt(date, time),
          contactId: contactId || null,
          relatedActivityId: relatedActivityId || null,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Das To-do konnte nicht angelegt werden.");
        return;
      }
      window.dispatchEvent(new Event("leadgreet:workbench-refresh"));
      setFormOpen(false);
    } catch {
      setError("Das To-do konnte nicht angelegt werden.");
    } finally {
      setPending(false);
    }
  }

  async function completeTodo(id: string) {
    setCompletingId(id);
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!response.ok) return;
      window.dispatchEvent(new Event("leadgreet:workbench-refresh"));
    } finally {
      setCompletingId(null);
    }
  }

  const createButton = canMutate ? (
    <button type="button" className="btn-ghost" onClick={openOwnTodo}>
      + To-do anlegen
    </button>
  ) : null;

  const createDialog = formOpen ? (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Formular schließen"
        onClick={() => {
          if (!pending) setFormOpen(false);
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-panel border border-line bg-canvas-card shadow-card sm:rounded-panel"
      >
        <form onSubmit={onSubmit}>
          <div className="border-b border-line px-5 py-4">
            <h3 id={titleId} className="text-base font-semibold text-ink">
              To-do anlegen
            </h3>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div>
              <label className={labelClass} htmlFor={`${titleId}-title`}>
                Aufgabe
              </label>
              <input
                id={`${titleId}-title`}
                className={fieldClass}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={300}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`${titleId}-date`}>
                  Fällig am
                </label>
                <input
                  id={`${titleId}-date`}
                  type="date"
                  className={fieldClass}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${titleId}-time`}>
                  Uhrzeit <span className="font-normal text-ink-faint">(optional)</span>
                </label>
                <input
                  id={`${titleId}-time`}
                  type="time"
                  className={fieldClass}
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor={`${titleId}-contact`}>
                Kontakt <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <select
                id={`${titleId}-contact`}
                className={fieldClass}
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
              >
                <option value="">Kein Kontakt</option>
                {availableContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contactDisplayLabel(contact)}
                  </option>
                ))}
              </select>
            </div>
            {formDraft?.channelHint ? (
              <p className="text-xs text-ink-muted">
                Empfohlener Kontaktweg: {formDraft.channelHint}
              </p>
            ) : null}
            <div>
              <label className={labelClass} htmlFor={`${titleId}-parent`}>
                Bezieht sich auf <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <select
                id={`${titleId}-parent`}
                className={fieldClass}
                value={relatedActivityId}
                onChange={(event) => setRelatedActivityId(event.target.value)}
              >
                <option value="">Keine vorherige Aktivität</option>
                {parentOptions.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activityTypeLabel(activity.type)}
                    {activity.subject ? ` · ${activity.subject}` : ""}
                  </option>
                ))}
              </select>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setFormOpen(false)}
              disabled={pending}
            >
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Wird angelegt…" : "To-do anlegen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  if (actionsOnly) {
    if (!canMutate) return null;
    return (
      <>
        {createButton}
        {createDialog}
      </>
    );
  }

  return (
    <section className="surface p-5">
      <SectionHeading hint="Was muss als Nächstes passieren?">To-dos</SectionHeading>
      <NextActionCard
        suggestion={suggestion}
        canMutate={canMutate}
        onAccept={openSuggestion}
        onOwnTodo={openOwnTodo}
      />

      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        Offene To-dos
      </p>
      {todos.length === 0 ? (
        <EmptyState
          title="Keine offenen To-dos"
          description="Legen Sie die nächste Aufgabe an, ohne sie mit einer vergangenen Aktivität zu vermischen."
        />
      ) : (
        <ul className="space-y-2.5">
          {openTodos.map((todo) => {
            const dueTime = formatTime(todo.dueAt);
            const contact = todo.contactName
              ? contactDisplayLabel({ fullName: todo.contactName, role: todo.contactRole })
              : null;
            return (
              <li key={todo.id} className="rounded-lg border border-line px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
                  To-do
                </p>
                <p className="mt-1 text-xs tabular text-ink-muted">
                  {formatDate(todo.dueAt)}
                  {dueTime ? ` · ${dueTime}` : ""}
                </p>
                <p className="mt-0.5 text-sm font-medium text-ink">{todo.title}</p>
                {contact ? <p className="mt-0.5 text-xs text-ink-muted">Kontakt: {contact}</p> : null}
                {canMutate ? (
                  <button
                    type="button"
                    className="btn-ghost mt-2"
                    onClick={() => completeTodo(todo.id)}
                    disabled={completingId === todo.id}
                  >
                    {completingId === todo.id ? "Wird erledigt…" : "Erledigen"}
                  </button>
                ) : null}
              </li>
            );
          })}
          {doneTodos.map((todo) => (
            <li key={todo.id} className="rounded-lg border border-line/70 px-3 py-2 text-ink-faint">
              <p className="text-xs tabular">
                Erledigt
                {todo.completedAt ? ` · ${formatDate(todo.completedAt)}` : ""}
              </p>
              <p className="mt-0.5 text-sm line-through">{todo.title}</p>
            </li>
          ))}
        </ul>
      )}

      {createDialog}
    </section>
  );
}
