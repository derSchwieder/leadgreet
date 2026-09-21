"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import type { IntelligenceNextStep } from "@/lib/intelligence/types";
import {
  activityLabelFromNextStep,
  activityTypeFromNextStep,
  nextStepDescription,
} from "@/lib/activities/from-next-step";

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

function nowTimeInputValue(): string {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function toOccurredAt(date: string, time: string): string {
  if (time) {
    return new Date(`${date}T${time}`).toISOString();
  }
  return new Date(`${date}T00:00:00`).toISOString();
}

export function NextStepActivityCapture({
  opportunityId,
  companyId,
  nextStep,
}: {
  opportunityId: string;
  companyId: string;
  nextStep: IntelligenceNextStep;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(nextStepDescription(nextStep));
  const [date, setDate] = useState(todayInputValue);
  const [time, setTime] = useState(nowTimeInputValue);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = activityTypeFromNextStep(nextStep);
  const typeLabel = activityLabelFromNextStep(nextStep);

  useEffect(() => {
    if (!open) return;
    setNote(nextStepDescription(nextStep));
    setDate(todayInputValue());
    setTime(nowTimeInputValue());
    setError(null);
    setPending(false);
  }, [open, nextStep]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending]);

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
          note: note.trim() || null,
          occurredAt: toOccurredAt(date, time),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Die Aktivität konnte nicht gespeichert werden.");
        return;
      }
      window.dispatchEvent(new Event("leadgreet:workbench-refresh"));
      setOpen(false);
    } catch {
      setError("Die Aktivität konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        Als Aktivität erfassen
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Dialog schließen"
            onClick={() => {
              if (!pending) setOpen(false);
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
                  Als Aktivität erfassen
                </h3>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div>
                  <p className={labelClass}>Aktivität</p>
                  <p className="text-sm text-ink">{typeLabel}</p>
                </div>
                <div>
                  <label className={labelClass} htmlFor="next-step-note">
                    Beschreibung
                  </label>
                  <textarea
                    id="next-step-note"
                    className={`${fieldClass} min-h-[88px] resize-y`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={8000}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="next-step-date">
                      Datum
                    </label>
                    <input
                      id="next-step-date"
                      type="date"
                      className={fieldClass}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="next-step-time">
                      Uhrzeit
                    </label>
                    <input
                      id="next-step-time"
                      type="time"
                      className={fieldClass}
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                    />
                  </div>
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
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn-primary" disabled={pending}>
                  {pending ? "Wird gespeichert…" : "Aktivität erfassen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
