import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TodayCockpitView } from "@/lib/dashboard/today-view";
import { TodayPriorityCard } from "./TodayPriorityCard";
import { TodayPriorityRow } from "./TodayPriorityRow";

export function TodayCockpit({ today }: { today: TodayCockpitView }) {
  if (!today.hero && today.more.length === 0) {
    return (
      <section className="surface px-6 py-8 sm:px-8">
        <p className="text-lg font-medium text-ink">Heute steht nichts Dringendes an.</p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
          Schau ins Radar, um neue Chancen zu entdecken.
        </p>
        <Link href="/radar" className="btn-primary mt-6 inline-flex items-center">
          Radar öffnen
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {today.hero ? <TodayPriorityCard card={today.hero} /> : null}

      {today.more.length > 0 ? (
        <section>
          <SectionHeading>Weitere Prioritäten</SectionHeading>
          <ul className="list-shell">
            {today.more.map((card) => (
              <TodayPriorityRow key={card.companyId} card={card} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
