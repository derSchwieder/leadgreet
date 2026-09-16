"use client";

import { useState } from "react";

export function AddToCrmButton({ opportunityId }: { opportunityId: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        result?: { message: string };
        error?: string;
      };
      setMessage(payload.result?.message ?? payload.error ?? "CRM is not connected.");
    } catch {
      setMessage("Could not reach the CRM adapter.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-md border border-accent bg-accent-glow px-4 py-2 text-sm text-accent transition hover:bg-accent hover:text-canvas disabled:opacity-60"
      >
        {pending ? "Sending…" : "Add to CRM"}
      </button>
      {message ? (
        <p role="status" className="mt-3 max-w-xl text-sm text-ink-muted">
          {message}
        </p>
      ) : (
        <p className="mt-3 text-xs text-ink-faint">UI-only in this sprint. No CRM is connected.</p>
      )}
    </div>
  );
}
