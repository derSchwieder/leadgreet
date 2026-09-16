export function DemoBanner({ seedCount }: { seedCount: number }) {
  if (seedCount <= 0) return null;

  return (
    <div
      role="status"
      className="mb-6 rounded-md border border-line bg-canvas-card px-4 py-3 text-sm text-ink-muted"
    >
      Demo dataset is loaded ({seedCount} seed records). All contacts, signals and
      opportunities are synthetic and flagged <code className="font-mono text-accent">isSeed</code>.
      They can be deleted later without touching real data.
    </div>
  );
}
