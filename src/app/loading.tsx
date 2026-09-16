export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-4 w-24 rounded bg-canvas-card" />
      <div className="h-8 w-56 rounded bg-canvas-card" />
      <div className="h-4 w-96 max-w-full rounded bg-canvas-card" />
      <div className="h-64 rounded-lg bg-canvas-card" />
    </div>
  );
}
