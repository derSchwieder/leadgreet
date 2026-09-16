import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-line bg-canvas-card p-6">
      <h1 className="text-lg font-semibold text-ink">Not found</h1>
      <p className="mt-2 text-sm text-ink-muted">This record does not exist.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-accent hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
