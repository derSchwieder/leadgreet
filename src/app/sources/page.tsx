import { DemoBanner } from "@/components/layout/DemoBanner";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getDatabaseGate } from "@/lib/db/status";
import { listSources } from "@/lib/db/sources";
import { display, formatDate, formatEnum } from "@/lib/format";

export default async function SourcesPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const sources = await listSources();
  const seedCount = sources.filter((source) => source.isSeed).length;

  return (
    <div>
      <PageHeader
        eyebrow="Nachweis"
        title="Quellen"
        description="Wo Signale beobachtet wurden. Spätere Sprints ergänzen Erfassungsadapter hinter diesem Modell."
      />
      <DemoBanner seedCount={seedCount} />
      {sources.length === 0 ? (
        <EmptyState
          title="Noch keine Quellen"
          description="Quellen entstehen, wenn Signale erfasst werden."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Quelle</th>
                <th>Typ</th>
                <th>Glaubwürdigkeit</th>
                <th>Abgerufen</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td className="text-ink">
                    <span className="inline-flex items-center gap-2">
                      {source.name}
                      {source.isSeed ? <DemoBadge /> : null}
                    </span>
                  </td>
                  <td className="text-ink-muted">{formatEnum(source.sourceType)}</td>
                  <td className="font-mono tabular text-ink-muted">{source.credibilityScore}</td>
                  <td className="font-mono text-ink-muted">{formatDate(source.accessedAt)}</td>
                  <td className="text-ink-muted">{display(source.url)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
