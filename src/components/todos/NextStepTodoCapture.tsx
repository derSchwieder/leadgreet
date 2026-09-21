"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import type { IntelligenceNextStep } from "@/lib/intelligence/types";
import { todoTitleFromNextStep } from "@/lib/todos/from-next-step";

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

export function NextStepTodoCapture({
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
  const [title, setTitle] = useState(todoTitleFromNextStep(nextStep));
  const [date, setDate] = useState(todayInputValue);
  const [time, setTime] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(todoTitleFromNextStep(nextStep));
    setDate(todayInputValue());
    setTime("");
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
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          companyId,
          title: title.trim(),
          dueAt: toDueAt(date, time),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Das To-do konnte nicht angelegt werden.");
        return;
      }
      window.dispatchEvent(new Event("leadgreet:workbench-refresh"));
      setOpen(false);
    } catch {
      setError("Das To-do konnte nicht angelegt werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        Als To-do anlegen
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
                  Als To-do anlegen
                </h3>
                <p className="mt-1 text-sm text-ink-muted">Was muss als Nächstes passieren?</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div>
                  <label className={labelClass} htmlFor="next-step-todo-title">
                    Aufgabe
                  </label>
                  <input
                    id="next-step-todo-title"
                    className={fieldClass}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={300}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="next-step-todo-date">
                      Fällig am
                    </label>
                    <input
                      id="next-step-todo-date"
                      type="date"
                      className={fieldClass}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="next-step-todo-time">
                      Uhrzeit <span className="font-normal text-ink-faint">(optional)</span>
                    </label>
                    <input
                      id="next-step-todo-time"
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
                  {pending ? "Wird angelegt…" : "To-do anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
