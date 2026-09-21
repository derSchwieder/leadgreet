import Link from "next/link";

export default function NotFound() {
  return (
    <div className="surface p-6">
      <h1 className="text-lg font-semibold text-ink">Nicht gefunden</h1>
      <p className="mt-2 text-sm text-ink-muted">Dieser Eintrag existiert nicht.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-accent hover:underline">
        Zurück zur Übersicht
      </Link>
    </div>
  );
}
