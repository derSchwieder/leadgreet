"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="surface p-6">
      <h1 className="text-lg font-semibold text-ink">Etwas ist schiefgelaufen</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Die Ansicht konnte nicht geladen werden. Bitte versuchen Sie es erneut.
      </p>
      {error.message ? (
        <p className="mt-2 text-xs text-ink-faint">{error.message}</p>
      ) : null}
      <button type="button" onClick={reset} className="btn-ghost mt-4">
        Erneut versuchen
      </button>
    </div>
  );
}
