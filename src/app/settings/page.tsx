import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getSeedInventory } from "@/lib/db/dashboard";
import { getDatabaseGate } from "@/lib/db/status";
import { INVENTORY_LABELS, SCORING_DIMENSION_LABELS, translateIndustry } from "@/lib/labels";
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
        eyebrow="Arbeitsbereich"
        title="Einstellungen"
        description="Bewertungsgewichtungen, CRM-Status und Überblick über Demo-Daten. Eine Anmeldung ist in diesem Sprint bewusst nicht enthalten."
      />

      {db !== "ready" ? <SetupState unreachable={db === "unreachable"} /> : null}

      <section className="mb-8 surface p-5">
        <h2 className="section-label">Bewertungsgewichtungen</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Diese Gewichtungen gelten zentral für die Bewertung. Änderungen erfolgen im Scoring-Modul —
          Oberfläche und Engine lesen dieselbe Quelle.
        </p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(SCORING_WEIGHTS).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-line bg-canvas-elevated px-3 py-3">
              <dt className="text-xs text-ink-muted">{SCORING_DIMENSION_LABELS[key] ?? key}</dt>
              <dd className="mt-1 font-mono text-xl tabular text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mb-8 surface p-5">
        <h2 className="section-label">Zielprofil</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Bevorzugte Branchen:{" "}
          {TARGET_COMPANY_PROFILE.preferredIndustries.map(translateIndustry).join(", ")}. Fokusregion:
          DACH. Mindestanzahl Mitarbeitende: {TARGET_COMPANY_PROFILE.minEmployees}.
        </p>
      </section>

      <section className="mb-8 surface p-5">
        <h2 className="section-label">CRM</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Aktiver Adapter: <span className="font-mono text-ink">{crm.provider}</span>
          {crm.configured ? " (konfiguriert)" : " (Platzhalter — nicht verbunden)"}. Die Anwendung
          spricht nur den CRM-Adapter an. Moco wird nicht direkt importiert.
        </p>
      </section>

      <section className="surface p-5">
        <h2 className="section-label">Demo-Daten</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Jeder Demo-Datensatz ist als Demo markiert und kann unabhängig von echten Daten gelöscht
          werden.
        </p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-5">
          {Object.entries(inventory).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs text-ink-muted">{INVENTORY_LABELS[key] ?? key}</dt>
              <dd className="font-mono text-lg tabular text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
