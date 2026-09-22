"use client";

import { useMemo, useState } from "react";
import type { SignalFeedbackReason } from "@/types";

type FeedbackState = {
  relevant: boolean;
  reason: SignalFeedbackReason | null;
};

const RELEVANT_REASONS: Array<{ value: SignalFeedbackReason; label: string }> = [
  { value: "FITS_PORTFOLIO", label: "Passt zu unserem Leistungsportfolio" },
  { value: "CONCRETE_NEED", label: "Konkreter Bedarf erkennbar" },
  { value: "GOOD_SALES_TRIGGER", label: "Guter Vertriebsanlass" },
  { value: "OTHER", label: "Sonstiger Grund" },
];

const IRRELEVANT_REASONS: Array<{ value: SignalFeedbackReason; label: string }> = [
  { value: "TOO_OLD", label: "Zu alt" },
  { value: "NO_CONCRETE_NEED", label: "Kein konkreter Bedarf" },
  { value: "WRONG_CONTEXT", label: "Falscher Kontext" },
  { value: "NOT_IN_PORTFOLIO", label: "Passt nicht zu unserem Leistungsportfolio" },
  { value: "OTHER", label: "Sonstiger Grund" },
];

export function SignalFeedbackControls({
  signalId,
  initial,
}: {
  signalId: string;
  initial?: FeedbackState | null;
}) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(initial ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = useMemo(
    () => (feedback?.relevant ? RELEVANT_REASONS : IRRELEVANT_REASONS),
    [feedback?.relevant],
  );

  async function save(next: FeedbackState) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/signal-feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId,
          relevant: next.relevant,
          reason: next.reason,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : "Feedback konnte nicht gespeichert werden.";
        throw new Error(message);
      }
      setFeedback(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Feedback konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] text-ink-muted">Ist dieses Signal für dich relevant?</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            save({
              relevant: true,
              reason: feedback?.relevant ? feedback.reason : null,
            })
          }
          className={
            feedback?.relevant === true
              ? "rounded-lg border border-accent bg-accent-glow px-2.5 py-1 text-xs font-medium text-accent"
              : "btn-ghost px-2.5 py-1 text-xs"
          }
        >
          👍 Relevant
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            save({
              relevant: false,
              reason: feedback?.relevant === false ? feedback.reason : null,
            })
          }
          className={
            feedback?.relevant === false
              ? "rounded-lg border border-accent bg-accent-glow px-2.5 py-1 text-xs font-medium text-accent"
              : "btn-ghost px-2.5 py-1 text-xs"
          }
        >
          👎 Nicht relevant
        </button>
      </div>
      {feedback ? (
        <div className="flex flex-wrap gap-1.5">
          {reasons.map((item) => {
            const active = feedback.reason === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={pending}
                onClick={() =>
                  save({
                    relevant: feedback.relevant,
                    reason: active ? null : item.value,
                  })
                }
                className={
                  active
                    ? "chip-accent"
                    : "chip transition hover:border-accent hover:text-accent"
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
