"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/labels";
import { OPPORTUNITY_STATUSES } from "@/types";

export function OpportunityStatusControl({
  opportunityId,
  status,
  canMutate,
}: {
  opportunityId: string;
  status: string;
  canMutate: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(status);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(status);

  useEffect(() => {
    setCurrent(status);
    setSelected(status);
  }, [status]);

  const dirty = selected !== current;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dirty) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus: selected,
          note: note.trim() || null,
        }),
      });
      const payload = (await response.json()) as {
        opportunity?: { status?: string };
        error?: string;
      };
      if (!response.ok || !payload.opportunity?.status) {
        setError(payload.error ?? "Der Status konnte nicht geändert werden.");
        return;
      }
      setCurrent(payload.opportunity.status);
      setSelected(payload.opportunity.status);
      setNote("");
      window.dispatchEvent(new Event("leadgreet:workbench-refresh"));
      router.refresh();
    } catch {
      setError("Der Status konnte nicht geändert werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-panel border border-line bg-canvas-card px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">Status</p>
      <div className="mt-2">
        <StatusBadge value={current} />
      </div>
      {canMutate ? (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted" htmlFor="opportunity-status">
              Status ändern
            </label>
            <select
              id="opportunity-status"
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              disabled={pending}
            >
              {OPPORTUNITY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {OPPORTUNITY_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          {dirty ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-muted" htmlFor="status-note">
                Notiz <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                id="status-note"
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={4000}
                disabled={pending}
              />
            </div>
          ) : null}
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!dirty || pending}>
            {pending ? "Wird gespeichert…" : "Status ändern"}
          </button>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
