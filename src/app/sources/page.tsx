import { DemoBanner } from "@/components/layout/DemoBanner";
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
        eyebrow="Evidence"
        title="Sources"
        description="Where signals were observed. Later sprints will add acquisition adapters behind this model."
      />
      <DemoBanner seedCount={seedCount} />
      {sources.length === 0 ? (
        <EmptyState title="No sources" description="Sources are created when signals are ingested." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-canvas-elevated text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Credibility</th>
                <th className="px-4 py-3 font-medium">Accessed</th>
                <th className="px-4 py-3 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-t border-line hover:bg-canvas-hover">
                  <td className="px-4 py-3 text-ink">
                    {source.name}
                    {source.isSeed ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-faint">
                        demo
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatEnum(source.sourceType)}</td>
                  <td className="px-4 py-3 font-mono tabular text-ink-muted">
                    {source.credibilityScore}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-muted">
                    {formatDate(source.accessedAt)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{display(source.url)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
