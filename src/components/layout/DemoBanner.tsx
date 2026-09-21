export function DemoBanner({ seedCount }: { seedCount: number }) {
  if (seedCount <= 0) return null;

  return (
    <div
      role="status"
      className="mb-8 rounded-panel border border-accent/20 bg-accent-glow px-4 py-3.5 text-sm text-ink-muted"
    >
      Demo-Daten sind geladen ({seedCount} Demo-Einträge). Kontakte, Signale und Chancen sind
      synthetisch und können später unabhängig von echten Daten entfernt werden.
    </div>
  );
}
