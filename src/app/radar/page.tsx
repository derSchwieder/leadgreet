import { RadarView } from "@/components/radar/RadarView";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { listRadarPoints } from "@/lib/db/radar";
import { getDatabaseGate } from "@/lib/db/status";

export default async function RadarPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const accountId = await getCurrentAccountId();
  const points = await listRadarPoints(accountId);

  return (
    <div>
      <PageHeader
        eyebrow="Greet"
        title="Greet Radar"
        description="Stadtzentren der Unternehmen mit aktuellem Greet. Die Positionen sind Ortskoordinaten, keine Firmenadressen."
      />
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
        <span>Markergröße und Hervorhebung folgen dem aktuellen Greet.</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          hoch
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-score-warm" />
          mittel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-score-cool" />
          niedriger
        </span>
      </div>
      <div className="radar-shell overflow-hidden max-lg:min-h-0 lg:h-[min(72vh,760px)] lg:min-h-[420px]">
        <RadarView points={points} />
      </div>
    </div>
  );
}
