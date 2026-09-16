export function SetupState({ unreachable = false }: { unreachable?: boolean }) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-line bg-canvas-card p-6 shadow-card">
      <p className="text-[11px] uppercase tracking-[0.18em] text-accent">Setup required</p>
      <h1 className="mt-3 text-xl font-semibold text-ink">
        {unreachable ? "Database is not reachable" : "Database is not configured"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        {unreachable
          ? "DATABASE_URL is set, but PostgreSQL did not accept a connection. Start Postgres (Docker or Neon), then migrate and seed."
          : "leadgreet needs a PostgreSQL connection string. Copy .env.example to .env, then run the commands below."}
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
