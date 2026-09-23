"use client";

import { collectCountryOptions, collectRadarIndustryOptions } from "@/lib/icp";
import type { IcpCompanyRecord, IcpFilterOption } from "@/lib/icp";

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink";
const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

export function RadarIcpFilters({
  companies,
  selectedIndustries,
  selectedCountries,
  employeesDraft,
  revenueDraft,
  saving = false,
  saved = false,
  error = null,
  knownCompanies,
  icpMatching,
  onRadar,
  onIndustriesChange,
  onCountriesChange,
  onEmployeesDraftChange,
  onRevenueDraftChange,
  onSave,
}: {
  companies: readonly IcpCompanyRecord[];
  selectedIndustries: readonly string[];
  selectedCountries: readonly string[];
  employeesDraft: string;
  revenueDraft: string;
  saving?: boolean;
  saved?: boolean;
  error?: string | null;
  knownCompanies: number;
  icpMatching: number;
  onRadar: number;
  onIndustriesChange: (values: string[]) => void;
  onCountriesChange: (values: string[]) => void;
  onEmployeesDraftChange: (value: string) => void;
  onRevenueDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  const industries = collectRadarIndustryOptions(companies);
  const countries = collectCountryOptions(companies);

  return (
    <section className="surface p-5">
      <p className="section-label">Mein ICP</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <IcpMultiSelect
          label="Branche"
          allLabel="Alle Branchen"
          name="icp-industry"
          options={industries}
          selected={selectedIndustries}
          emptyHint="Keine Branche in den Unternehmensdaten hinterlegt."
          onChange={onIndustriesChange}
        />
        <IcpMultiSelect
          label="Land"
          allLabel="Alle Länder"
          name="icp-country"
          options={countries}
          selected={selectedCountries}
          emptyHint="Kein Land in den Unternehmensdaten hinterlegt."
          onChange={onCountriesChange}
        />
      </div>

      <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="icp-employees">
            Mitarbeiter
          </label>
          <p className="mb-1.5 text-xs text-ink-muted">mindestens</p>
          <input
            id="icp-employees"
            name="icp-employees"
            className={fieldClass}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="z. B. 100"
            value={employeesDraft}
            onChange={(event) => onEmployeesDraftChange(event.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="icp-revenue">
            Umsatz
          </label>
          <p className="mb-1.5 text-xs text-ink-muted">mindestens</p>
          <div className="flex items-center gap-2">
            <input
              id="icp-revenue"
              name="icp-revenue"
              className={fieldClass}
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              placeholder="z. B. 50"
              value={revenueDraft}
              onChange={(event) => onRevenueDraftChange(event.target.value)}
            />
            <span className="shrink-0 text-xs text-ink-muted">Mio. €</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary tracking-[0.12em]"
          disabled={saving}
          onClick={onSave}
        >
          ICP SPEICHERN
        </button>
        {saved ? (
          <div className="text-sm">
            <p className="text-accent">ICP gespeichert</p>
            <p className="mt-2 text-ink-muted">
              {knownCompanies} bekannte Unternehmen
              <br />
              {icpMatching} ICP-passend
              <br />
              {onRadar} auf dem Radar
            </p>
          </div>
        ) : null}
        {error ? <p className="text-sm text-score-warm">{error}</p> : null}
      </div>
    </section>
  );
}

function IcpMultiSelect({
  label,
  allLabel,
  name,
  options,
  selected,
  emptyHint,
  onChange,
}: {
  label: string;
  allLabel: string;
  name: string;
  options: readonly IcpFilterOption[];
  selected: readonly string[];
  emptyHint: string;
  onChange: (values: string[]) => void;
}) {
  const summary =
    selected.length === 0
      ? allLabel
      : options
          .filter((option) => selected.includes(option.value))
          .map((option) => option.label)
          .join(", ") || allLabel;

  function toggle(value: string, checked: boolean) {
    if (checked) {
      onChange([...selected, value]);
      return;
    }
    onChange(selected.filter((item) => item !== value));
  }

  return (
    <div>
      <p className={labelClass}>{label}</p>
      <details className="rounded-lg border border-line bg-canvas">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm text-ink [&::-webkit-details-marker]:hidden">
          <span>{summary}</span>
          <span className="text-ink-faint" aria-hidden="true">
            ▾
          </span>
        </summary>
        <div className="max-h-48 space-y-1 overflow-auto border-t border-line p-2">
          {options.length === 0 ? (
            <p className="px-1 py-1 text-xs text-ink-muted">{emptyHint}</p>
          ) : (
            options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-ink hover:bg-canvas-hover"
              >
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  checked={selected.includes(option.value)}
                  onChange={(event) => toggle(option.value, event.target.checked)}
                />
                {option.label}
              </label>
            ))
          )}
        </div>
      </details>
    </div>
  );
}
