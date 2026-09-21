export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-live="polite">
      <div className="h-3 w-24 rounded bg-canvas-card" />
      <div className="h-8 w-56 rounded bg-canvas-card" />
      <div className="h-4 w-96 max-w-full rounded bg-canvas-card" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 rounded-panel bg-canvas-card" />
        <div className="h-28 rounded-panel bg-canvas-card" />
        <div className="h-28 rounded-panel bg-canvas-card" />
        <div className="h-28 rounded-panel bg-canvas-card" />
      </div>
      <div className="h-72 rounded-panel bg-canvas-card" />
    </div>
  );
}
