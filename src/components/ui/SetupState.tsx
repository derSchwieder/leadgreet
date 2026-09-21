export function SetupState({ unreachable = false }: { unreachable?: boolean }) {
  return (
    <div className="mx-auto max-w-lg surface p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
        Einrichtung erforderlich
      </p>
      <h1 className="mt-3 text-xl font-semibold text-ink">
        {unreachable ? "Datenbank ist nicht erreichbar" : "Datenbank ist nicht konfiguriert"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        {unreachable
          ? "DATABASE_URL ist gesetzt, aber PostgreSQL hat die Verbindung nicht angenommen. Bitte Postgres starten (Docker oder Neon), anschließend migrieren und Demo-Daten laden."
          : "leadgreet benötigt eine PostgreSQL-Verbindung. Kopieren Sie .env.example nach .env und führen Sie danach die folgenden Schritte aus."}
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
        <li>
          <code className="font-mono text-ink">docker compose up -d</code>
        </li>
        <li>
          <code className="font-mono text-ink">npx prisma migrate dev --name init</code>
        </li>
        <li>
          <code className="font-mono text-ink">npm run db:seed</code>
        </li>
      </ol>
    </div>
  );
}
