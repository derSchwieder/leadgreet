"use client";

import { useRouter } from "next/navigation";
import {
  BUSINESS_CASE_LABELS,
  CONTENT_TYPE_LABELS,
} from "@/lib/labels";
import { BUSINESS_CASE_TYPES, CONTENT_TYPES } from "@/types";

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink";
const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

export type ContentFilterService = { id: string; name: string };

export type ContentFilterState = {
  type?: string;
  serviceId?: string;
  businessCase?: string;
  active?: string;
};

export function ContentFilters({
  services,
  current,
}: {
  services: ContentFilterService[];
  current: ContentFilterState;
}) {
  const router = useRouter();

  function apply(next: ContentFilterState) {
    const params = new URLSearchParams();
    if (next.type) params.set("type", next.type);
    if (next.serviceId) params.set("serviceId", next.serviceId);
    if (next.businessCase) params.set("businessCase", next.businessCase);
    if (next.active) params.set("active", next.active);
    const query = params.toString();
    router.push(query ? `/content?${query}` : "/content");
  }

  return (
    <div className="mb-6 grid gap-3 surface p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className={labelClass} htmlFor="content-filter-type">
          Typ
        </label>
        <select
          id="content-filter-type"
          className={fieldClass}
          value={current.type ?? ""}
          onChange={(event) => apply({ ...current, type: event.target.value || undefined })}
        >
          <option value="">Alle Typen</option>
          {CONTENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {CONTENT_TYPE_LABELS[value] ?? value}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="content-filter-service">
          Service
        </label>
        <select
          id="content-filter-service"
          className={fieldClass}
          value={current.serviceId ?? ""}
          onChange={(event) => apply({ ...current, serviceId: event.target.value || undefined })}
        >
          <option value="">Alle Services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="content-filter-business-case">
          Business Case
        </label>
        <select
          id="content-filter-business-case"
          className={fieldClass}
          value={current.businessCase ?? ""}
          onChange={(event) =>
            apply({ ...current, businessCase: event.target.value || undefined })
          }
        >
          <option value="">Alle Business Cases</option>
          {BUSINESS_CASE_TYPES.map((value) => (
            <option key={value} value={value}>
              {BUSINESS_CASE_LABELS[value] ?? value}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="content-filter-active">
          Status
        </label>
        <select
          id="content-filter-active"
          className={fieldClass}
          value={current.active ?? ""}
          onChange={(event) => apply({ ...current, active: event.target.value || undefined })}
        >
          <option value="">Aktiv und inaktiv</option>
          <option value="true">Nur aktive</option>
          <option value="false">Nur inaktive</option>
        </select>
      </div>
    </div>
  );
}
