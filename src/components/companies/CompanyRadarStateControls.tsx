"use client";

import { useState } from "react";
import type { AccountCompanyStatus } from "@/types";

export function CompanyRadarStateControls({
  companyId,
  initialStatus,
  initialNote,
}: {
  companyId: string;
  initialStatus: AccountCompanyStatus | null;
  initialNote?: string | null;
}) {
  const [status, setStatus] = useState<AccountCompanyStatus | null>(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: AccountCompanyStatus | null, nextNote?: string) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/companies/${companyId}/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          note: next == null ? null : nextNote ?? note,
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError("Status konnte nicht gespeichert werden.");
        return;
      }
      const saved = (body as { state?: { status: AccountCompanyStatus | null; note: string | null } })
        .state;
      setStatus(saved?.status ?? next);
      setNote(saved?.note ?? (next == null ? "" : nextNote ?? note));
    } catch {
      setError("Status konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="section-label">Radar</p>
      <p className="mt-1 text-sm text-ink-muted">
        {status === "NOT_RELEVANT"
          ? "Dieses Unternehmen ist für deinen Account als nicht relevant markiert."
          : status === "DECLINED"
            ? "Dieses Unternehmen ist für deinen Account abgelehnt."
            : "Unternehmen aus dem Radar dieses Accounts entfernen."}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {status == null ? (
          <>
            <button
              type="button"
              className="btn-ghost"
              disabled={pending}
              onClick={() => void save("NOT_RELEVANT")}
            >
              Nicht relevant
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={pending}
              onClick={() => void save("DECLINED")}
            >
              Abgelehnt
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn-ghost"
            disabled={pending}
            onClick={() => void save(null)}
          >
            Status zurücksetzen
          </button>
        )}
      </div>
      {status === "DECLINED" || status == null ? (
        <label className="mt-3 block max-w-md">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">Notiz</span>
          <input
            className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink"
            value={note}
            disabled={pending}
            placeholder="optional"
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      ) : null}
      {error ? <p className="mt-2 text-sm text-score-warm">{error}</p> : null}
    </div>
  );
}
