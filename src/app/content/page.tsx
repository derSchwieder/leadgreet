import Link from "next/link";
import { ContentFilters } from "@/components/content/ContentFilters";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { listContentItems } from "@/lib/db/content";
import { listServices } from "@/lib/db/services";
import { getDatabaseGate } from "@/lib/db/status";
import { formatEnum } from "@/lib/format";
import { BUSINESS_CASE_TYPES, CONTENT_TYPES, type BusinessCaseType, type ContentType } from "@/types";

export default async function ContentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    serviceId?: string;
    businessCase?: string;
    active?: string;
  }>;
}) {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const params = await searchParams;
  const type = CONTENT_TYPES.includes(params.type as ContentType)
    ? (params.type as ContentType)
    : undefined;
  const businessCaseType = BUSINESS_CASE_TYPES.includes(params.businessCase as BusinessCaseType)
    ? (params.businessCase as BusinessCaseType)
    : undefined;
  const serviceId = params.serviceId?.trim() || undefined;
  const isActive =
    params.active === "true" ? true : params.active === "false" ? false : undefined;

  const accountId = await getCurrentAccountId();
  const [items, services] = await Promise.all([
    listContentItems(accountId, { type, serviceId, businessCaseType, isActive }),
    listServices(accountId),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          className="mb-0"
          eyebrow="Sales Workbench"
          title="Meine Inhalte"
          description="Deine Präsentationen, One-Pager, Referenzen und weiteren Vertriebsinhalte."
        />
        <Link href="/content/new" className="btn-primary shrink-0">
          + Inhalt hinzufügen
        </Link>
      </div>

      <ContentFilters
        services={services.map((service) => ({ id: service.id, name: service.name }))}
        current={{
          type,
          serviceId,
          businessCase: businessCaseType,
          active: params.active === "true" || params.active === "false" ? params.active : undefined,
        }}
      />

      {items.length === 0 ? (
        <EmptyState
          title="Noch keine Inhalte"
          description="Lege One-Pager, Präsentationen oder Referenzen an und verknüpfe sie mit Services und Business Cases."
        />
      ) : (
        <ul className="grid gap-4">
          {items.map((item) => (
            <li key={item.id} className="surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ContentTypeBadge type={item.type} />
                    <span className={item.isActive ? "chip-accent" : "chip"}>
                      {item.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  </div>
                  <Link
                    href={`/content/${item.id}`}
                    className="block text-sm font-medium text-ink hover:text-accent"
                  >
                    {item.name}
                  </Link>
                  {item.description ? (
                    <p className="max-w-3xl text-sm leading-6 text-ink-muted">{item.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-faint">
                    <p>
                      Services:{" "}
                      <span className="text-ink-muted">
                        {item.services.length > 0
                          ? item.services.map((service) => service.name).join(", ")
                          : "—"}
                      </span>
                    </p>
                    <p>
                      Business Cases:{" "}
                      <span className="text-ink-muted">
                        {item.businessCaseTypes.length > 0
                          ? item.businessCaseTypes.map(formatEnum).join(", ")
                          : "—"}
                      </span>
                    </p>
                    {item.targetRoles.length > 0 ? (
                      <p>
                        Zielrollen:{" "}
                        <span className="text-ink-muted">
                          {item.targetRoles.map(formatEnum).join(", ")}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  {item.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span key={tag} className="chip">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
