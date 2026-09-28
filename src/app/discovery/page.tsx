import { DiscoveryInbox } from "@/components/discovery/DiscoveryInbox";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { listUnresolvedSignals } from "@/lib/db/discovery";
import { getDatabaseGate } from "@/lib/db/status";
import {
  availableSignalTypes,
  toDiscoveryViewItem,
} from "@/components/discovery/discovery-presentation";

export default async function DiscoveryPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const [newItems, reviewedItems] = await Promise.all([
    listUnresolvedSignals({ status: "NEW", limit: 100 }),
    listUnresolvedSignals({ status: "REVIEWED", limit: 100 }),
  ]);
  const initialItems = newItems.map(toDiscoveryViewItem);
  const reviewed = reviewedItems.map(toDiscoveryViewItem);

  return (
    <div>
      <PageHeader
        eyebrow="Discovery"
        title="Neue Entdeckungen"
        description="Neue Signale, die noch keinem bestehenden Unternehmen eindeutig zugeordnet wurden."
      />
      <DiscoveryInbox
        initialItems={initialItems}
        initialReviewedCount={reviewed.length}
        availableTypes={availableSignalTypes([...initialItems, ...reviewed])}
      />
    </div>
  );
}
