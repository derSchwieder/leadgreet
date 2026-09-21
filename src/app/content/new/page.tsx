import Link from "next/link";
import { ContentForm } from "@/components/content/ContentForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { listServices } from "@/lib/db/services";
import { getDatabaseGate } from "@/lib/db/status";

export default async function NewContentPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const accountId = await getCurrentAccountId();
  const services = await listServices(accountId);

  return (
    <div>
      <div className="mb-6">
        <Link href="/content" className="text-sm text-ink-muted hover:text-accent">
          ← Meine Inhalte
        </Link>
      </div>
      <PageHeader
        eyebrow="Sales Workbench"
        title="Inhalt hinzufügen"
        description="Name und Typ reichen für den Einstieg. Zuordnungen zu Services, Business Cases und Zielgruppen kannst du später ergänzen."
      />
      <div className="surface p-5">
        <ContentForm
          services={services.map((service) => ({ id: service.id, name: service.name }))}
          submitLabel="Speichern"
        />
      </div>
    </div>
  );
}
