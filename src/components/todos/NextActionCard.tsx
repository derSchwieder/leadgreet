"use client";

import type { NextActionSuggestion } from "@/lib/todos/next-action";

export function NextActionCard({
  suggestion,
  canMutate,
  onAccept,
  onOwnTodo,
}: {
  suggestion: NextActionSuggestion | null;
  canMutate: boolean;
  onAccept: () => void;
  onOwnTodo: () => void;
}) {
  return (
    <div className="mb-4 rounded-lg border border-line px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        Das sollte als Nächstes passieren
      </p>

      {suggestion ? (
        <>
          <p className="mt-2 text-sm font-medium text-ink">{suggestion.title}</p>
          {suggestion.contactLabel ? (
            <p className="mt-1 text-xs text-ink-muted">{suggestion.contactLabel}</p>
          ) : null}

          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
            Empfohlener Kontaktweg
          </p>
          <p className="mt-1 text-sm text-ink">{suggestion.channel.label}</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{suggestion.channel.reason}</p>
          {suggestion.channel.researchPhoneHint ? (
            <p className="mt-1 text-xs text-ink-faint">Telefonnummer recherchieren</p>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">Kein konkreter nächster Schritt vorgeschlagen.</p>
      )}

      {canMutate ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestion ? (
            <button type="button" className="btn-primary" onClick={onAccept}>
              Vorschlag übernehmen
            </button>
          ) : null}
          <button type="button" className="btn-ghost" onClick={onOwnTodo}>
            Eigenes To-do
          </button>
        </div>
      ) : null}
    </div>
  );
}
