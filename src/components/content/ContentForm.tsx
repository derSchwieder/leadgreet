"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BUSINESS_CASE_LABELS,
  COMPANY_SIZE_LABELS,
  CONTACT_ROLE_LABELS,
  CONTENT_TYPE_LABELS,
} from "@/lib/labels";
import { BUSINESS_CASE_TYPES, COMPANY_SIZES, CONTACT_ROLES, CONTENT_TYPES } from "@/types";

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint";
const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

export type ContentFormService = { id: string; name: string };

export type ContentFormValue = {
  name: string;
  description: string;
  type: string;
  url: string;
  tags: string[];
  businessCaseTypes: string[];
  targetRoles: string[];
  targetCompanySizes: string[];
  serviceIds: string[];
  isActive: boolean;
};

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function ContentForm({
  services,
  initial,
  submitLabel,
  allowDelete,
  contentId,
}: {
  services: ContentFormService[];
  initial?: Partial<ContentFormValue>;
  submitLabel: string;
  allowDelete?: boolean;
  contentId?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState(initial?.type ?? "ONE_PAGER");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [businessCaseTypes, setBusinessCaseTypes] = useState<string[]>(
    initial?.businessCaseTypes ?? [],
  );
  const [targetRoles, setTargetRoles] = useState<string[]>(initial?.targetRoles ?? []);
  const [targetCompanySizes, setTargetCompanySizes] = useState<string[]>(
    initial?.targetCompanySizes ?? [],
  );
  const [serviceIds, setServiceIds] = useState<string[]>(initial?.serviceIds ?? []);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      name,
      description: description.trim() || null,
      type,
      url: url.trim() || null,
      tags: tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      businessCaseTypes,
      targetRoles,
      targetCompanySizes,
      serviceIds,
      isActive,
    }),
    [
      name,
      description,
      type,
      url,
      tagsText,
      businessCaseTypes,
      targetRoles,
      targetCompanySizes,
      serviceIds,
      isActive,
    ],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch(contentId ? `/api/content/${contentId}` : "/api/content", {
        method: contentId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string; item?: { id: string } };
      if (!response.ok) {
        throw new Error(body.error ?? "Speichern fehlgeschlagen.");
      }
      router.push("/content");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!contentId) return;
    if (!window.confirm("Diesen Inhalt wirklich löschen? Das kann nicht rückgängig gemacht werden.")) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/content/${contentId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Löschen fehlgeschlagen.");
      }
      router.push("/content");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Löschen fehlgeschlagen.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className={labelClass} htmlFor="content-name">
          Name
        </label>
        <input
          id="content-name"
          className={fieldClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={200}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="content-type">
          Typ
        </label>
        <select
          id="content-type"
          className={fieldClass}
          value={type}
          onChange={(event) => setType(event.target.value)}
          required
        >
          {CONTENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {CONTENT_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="content-description">
          Beschreibung
        </label>
        <textarea
          id="content-description"
          className={`${fieldClass} min-h-28`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="content-url">
          URL
        </label>
        <input
          id="content-url"
          className={fieldClass}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://"
        />
      </div>

      <fieldset>
        <legend className={labelClass}>Services</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <label key={service.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={serviceIds.includes(service.id)}
                onChange={() => setServiceIds(toggleValue(serviceIds, service.id))}
              />
              {service.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Business Cases</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {BUSINESS_CASE_TYPES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={businessCaseTypes.includes(value)}
                onChange={() => setBusinessCaseTypes(toggleValue(businessCaseTypes, value))}
              />
              {BUSINESS_CASE_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Zielrollen</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONTACT_ROLES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={targetRoles.includes(value)}
                onChange={() => setTargetRoles(toggleValue(targetRoles, value))}
              />
              {CONTACT_ROLE_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Unternehmensgröße</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMPANY_SIZES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={targetCompanySizes.includes(value)}
                onChange={() => setTargetCompanySizes(toggleValue(targetCompanySizes, value))}
              />
              {COMPANY_SIZE_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="content-tags">
          Tags
        </label>
        <input
          id="content-tags"
          className={fieldClass}
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="KI, Strategie, Assessment"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Aktiv
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Wird gespeichert…" : submitLabel}
        </button>
        {allowDelete && contentId ? (
          <button type="button" className="btn-ghost" disabled={pending} onClick={() => void onDelete()}>
            Löschen
          </button>
        ) : null}
      </div>
    </form>
  );
}
