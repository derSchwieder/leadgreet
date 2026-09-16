import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getSeedInventory } from "@/lib/db/dashboard";
import { getDatabaseGate } from "@/lib/db/status";
import { SCORING_WEIGHTS, TARGET_COMPANY_PROFILE } from "@/lib/scoring";
import { getCRMClient } from "@/lib/crm";

export default async function SettingsPage() {
  const crm = getCRMClient();
  const db = await getDatabaseGate();
  const inventory =
    db === "ready"
      ? await getSeedInventory()
      : { companies: 0, signals: 0, contacts: 0, opportunities: 0, sources: 0 };

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Scoring weights, CRM adapter status, and seed-data inventory. Authentication is intentionally not included in this sprint."
      />

      {db !== "ready" ? <SetupState unreachable={db === "unreachable"} /> : null}

      <section className="mb-8 rounded-lg border border-line bg-canvas-card p-5">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-faint">Scoring weights</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Stored in <code className="font-mono text-accent">src/lib/scoring/weights.ts</code>. Change
          them there — the UI and engine both read the same source.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(SCORING_WEIGHTS).map(([key, value]) => (
            <div key={key} className="rounded-md border border-line px-3 py-3">
              <dt className="text-xs text-ink-muted">{key}</dt>
              <dd className="mt-1 font-mono text-xl tabular text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-8 rounded-lg border border-line bg-canvas-card p-5">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-faint">Target profile</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Preferred industries: {TARGET_COMPANY_PROFILE.preferredIndustries.join(", ")}. Focus region:
          DACH. Minimum employees: {TARGET_COMPANY_PROFILE.minEmployees}.
        </p>
      </section>

      <section className="mb-8 rounded-lg border border-line bg-canvas-card p-5">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-faint">CRM</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Active adapter: <span className="font-mono text-ink">{crm.provider}</span>
          {crm.configured ? " (configured)" : " (stub — not connected)"}. The application depends on{" "}
          <code className="font-mono text-accent">src/lib/crm</code> only. Moco is not imported.
        </p>
      </section>

      <section className="rounded-lg border border-line bg-canvas-card p-5">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-faint">Seed data</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Every demo record is flagged <code className="font-mono text-accent">isSeed = true</code> and
          can be deleted independently of real data.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-5">
          {Object.entries(inventory).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs text-ink-muted">{key}</dt>
              <dd className="font-mono text-lg tabular text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
