import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentForm } from "@/components/content/ContentForm";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getContentItemById } from "@/lib/db/content";
import { listServices } from "@/lib/db/services";
import { NotFoundError } from "@/lib/db/serialize";
import { getDatabaseGate } from "@/lib/db/status";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const { id } = await params;
  const accountId = await getCurrentAccountId();

  try {
    const [item, services] = await Promise.all([
      getContentItemById(accountId, id),
      listServices(accountId),
    ]);

    return (
      <div>
        <div className="mb-6">
          <Link href="/content" className="text-sm text-ink-muted hover:text-accent">
            ← Meine Inhalte
          </Link>
        </div>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <ContentTypeBadge type={item.type} />
              <span className={item.isActive ? "chip-accent" : "chip"}>
                {item.isActive ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
            <PageHeader
              className="mb-0"
              title={item.name}
              description={item.description ?? undefined}
            />
          </div>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost shrink-0"
            >
              Öffnen
            </a>
          ) : null}
        </div>
        <div className="surface p-5">
          <ContentForm
            services={services.map((service) => ({ id: service.id, name: service.name }))}
            initial={{
              name: item.name,
              description: item.description ?? "",
              type: item.type,
              url: item.url ?? "",
              tags: item.tags,
              businessCaseTypes: item.businessCaseTypes,
              targetRoles: item.targetRoles,
              targetCompanySizes: item.targetCompanySizes,
              serviceIds: item.services.map((service) => service.id),
              isActive: item.isActive,
            }}
            submitLabel="Speichern"
            allowDelete
            contentId={item.id}
          />
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}
