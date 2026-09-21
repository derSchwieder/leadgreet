"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { contactDisplayLabel } from "@/lib/contacts/display";
import {
  ACTIVITY_OUTCOME_LABELS,
  DOCUMENTABLE_ACTIVITY_TYPES,
  activityTypeLabel,
} from "@/lib/labels";
import type { TimelineActivity, TimelineContact } from "./types";

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint";
const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

function toOccurredAt(date: string, time: string): string {
  if (time) {
    return new Date(`${date}T${time}`).toISOString();
  }
  return new Date(`${date}T00:00:00`).toISOString();
}

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function toTimelineContacts(payload: unknown): TimelineContact[] {
  if (!payload || typeof payload !== "object" || !("contacts" in payload)) return [];
  const contacts = (payload as { contacts?: unknown }).contacts;
  if (!Array.isArray(contacts)) return [];
  return contacts.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const contact = item as { id?: unknown; fullName?: unknown; role?: unknown };
    if (typeof contact.id !== "string" || typeof contact.fullName !== "string") return [];
    return [
      {
        id: contact.id,
        fullName: contact.fullName,
        role: typeof contact.role === "string" ? contact.role : null,
      },
    ];
  });
}

export function ActivityForm({
  open,
  opportunityId,
  companyId,
  contacts,
  activities,
  onClose,
  onCreated,
}: {
  open: boolean;
  opportunityId: string;
  companyId: string;
  contacts: TimelineContact[];
  activities: TimelineActivity[];
  onClose: () => void;
  onCreated: (activity: TimelineActivity) => void;
}) {
  const titleId = useId();
  const [type, setType] = useState<string>("EMAIL_SENT");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayInputValue);
  const [time, setTime] = useState("");
  const [contactId, setContactId] = useState("");
  const [outcome, setOutcome] = useState("");
  const [responseToActivityId, setResponseToActivityId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableContacts, setAvailableContacts] = useState(contacts);

  const parentOptions = useMemo(
    () =>
      [...activities].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    [activities],
  );

  useEffect(() => {
    if (!open) return;
    setType("EMAIL_SENT");
    setSubject("");
    setNote("");
    setDate(todayInputValue());
    setTime("");
    setContactId("");
    setOutcome("");
    setResponseToActivityId("");
    setError(null);
    setPending(false);
    setAvailableContacts(contacts);
  }, [open, contacts]);

  useEffect(() => {
    async function reloadContacts() {
      const response = await fetch(`/api/contacts?companyId=${encodeURIComponent(companyId)}`);
      if (!response.ok) return;
      const payload: unknown = await response.json();
      setAvailableContacts(toTimelineContacts(payload));
    }

    window.addEventListener("leadgreet:workbench-refresh", reloadContacts);
    return () => window.removeEventListener("leadgreet:workbench-refresh", reloadContacts);
  }, [companyId]);

  useEffect(() => {
    if (!open || contacts.length > 0) return;
    let cancelled = false;

    fetch(`/api/contacts?companyId=${encodeURIComponent(companyId)}`)
      .then(async (response) => {
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (!cancelled) setAvailableContacts(toTimelineContacts(payload));
      })
      .catch(() => {
        /* keep empty list */
      });

    return () => {
      cancelled = true;
    };
  }, [open, companyId, contacts.length]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          companyId,
          type,
          subject: subject.trim() || null,
          note: note.trim() || null,
          occurredAt: toOccurredAt(date, time),
          contactId: contactId || null,
          outcome: outcome || null,
          responseToActivityId: responseToActivityId || null,
        }),
      });
      const payload = (await response.json()) as {
        activity?: {
          id: string;
          type: string;
          subject: string | null;
          note: string | null;
          occurredAt: string;
          outcome: string | null;
          contactId: string | null;
          responseToActivityId: string | null;
        };
        error?: string;
      };
      if (!response.ok || !payload.activity) {
        setError(payload.error ?? "Die Aktivität konnte nicht gespeichert werden.");
        return;
      }

      const created = payload.activity;
      const selected = availableContacts.find((contact) => contact.id === created.contactId);
      onCreated({
        id: created.id,
        type: created.type,
        subject: created.subject,
        note: created.note,
        occurredAt: created.occurredAt,
        outcome: created.outcome,
        contactId: created.contactId,
        contactName: selected?.fullName ?? null,
        contactRole: selected?.role ?? null,
        responseToActivityId: created.responseToActivityId,
      });
      onClose();
    } catch {
      setError("Die Aktivität konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Formular schließen"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-panel border border-line bg-canvas-card shadow-card sm:rounded-panel"
      >
        <div className="border-b border-line px-5 py-4">
          <h3 id={titleId} className="text-base font-semibold text-ink">
            Aktivität dokumentieren
          </h3>
          <p className="mt-1 text-sm text-ink-muted">Was ist passiert?</p>
        </div>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <label className={labelClass} htmlFor={`${titleId}-type`}>
                Typ
              </label>
              <select
                id={`${titleId}-type`}
                className={fieldClass}
                value={type}
                onChange={(event) => setType(event.target.value)}
                required
              >
                {DOCUMENTABLE_ACTIVITY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {activityTypeLabel(value)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor={`${titleId}-subject`}>
                Betreff
              </label>
              <input
                id={`${titleId}-subject`}
                className={fieldClass}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={300}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`${titleId}-note`}>
                Notiz
              </label>
              <textarea
                id={`${titleId}-note`}
                className={`${fieldClass} min-h-[96px] resize-y`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={8000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`${titleId}-date`}>
                  Datum
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
            <div className="rounded-lg border border-line px-3 py-2">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-ink-muted">
                  Weitere Angaben
                </summary>
                <div className="mt-3 space-y-4">
                  <div>
                    <label className={labelClass} htmlFor={`${titleId}-outcome`}>
                      Reaktion <span className="font-normal text-ink-faint">(optional)</span>
                    </label>
                    <select
                      id={`${titleId}-outcome`}
                      className={fieldClass}
                      value={outcome}
                      onChange={(event) => setOutcome(event.target.value)}
                    >
                      <option value="">Keine Angabe</option>
                      {Object.entries(ACTIVITY_OUTCOME_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`${titleId}-parent`}>
                      Bezieht sich auf <span className="font-normal text-ink-faint">(optional)</span>
                    </label>
                    <select
                      id={`${titleId}-parent`}
                      className={fieldClass}
                      value={responseToActivityId}
                      onChange={(event) => setResponseToActivityId(event.target.value)}
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
                </div>
              </details>
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
              onClick={onClose}
              disabled={pending}
            >
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Wird gespeichert…" : "Aktivität speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
