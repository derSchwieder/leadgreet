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
        result?: { ok?: boolean; message?: string };
        error?: string;
      };
      if (payload.result?.ok) {
        setMessage(payload.result.message ?? "Die Chance wurde an das CRM übergeben.");
      } else {
        setMessage(
          "CRM ist nicht verbunden. Die Chance wurde nicht exportiert. Hinterlegen Sie einen CRM-Adapter, um diesen Schritt zu nutzen.",
        );
      }
    } catch {
      setMessage("Der CRM-Adapter konnte nicht erreicht werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={onClick} disabled={pending} className="btn-primary">
        {pending ? "Wird gesendet…" : "An CRM übergeben"}
      </button>
      {message ? (
        <p role="status" className="mt-3 max-w-xl text-sm text-ink-muted">
          {message}
        </p>
      ) : (
        <p className="mt-3 text-xs text-ink-faint">
          In diesem Sprint nur die Oberfläche. Es ist kein CRM verbunden.
        </p>
      )}
    </div>
  );
}
