"use client";

import { useEffect, useMemo, useState } from "react";
import { EntitySearchField } from "@/components/ui/EntitySearchField";
import {
  DEFAULT_RADAR_PROFILE_NAME,
  eurosToMillionInput,
  parseEmployeesDraft,
  parseMillionDraft,
  summarizeRadarIcp,
  toIcpProfile,
  type IcpCompanyRecord,
  type RadarProfileView,
  type StoredAccountIcp,
} from "@/lib/icp";
import { filterRadarPointsBySearch, normalizeSearchQuery } from "@/lib/search/entity-search";
import type { RadarPoint } from "@/lib/radar";
import { RadarIcpFilters } from "./RadarIcpFilters";
import { RadarProfileSelector } from "./RadarProfileSelector";
import { RadarIcpStats } from "./RadarIcpStats";
import { RadarScope } from "./RadarScope";
import { RadarSensitivitySlider } from "./RadarSensitivitySlider";
import { RadarView } from "./RadarView";
import {
  isRadarMapVisible,
  nextRadarPhaseAfterScan,
  nextRadarPhaseAfterStart,
  prefersReducedMotion,
  radarStartButtonLabel,
  type RadarDashboardPhase,
} from "./radar-dashboard";
import { projectRadarScopeDots } from "./radar-scope";

const SCAN_MS = 1600;

function profilesFromProps(
  initialIcp: StoredAccountIcp,
  initialProfiles?: RadarProfileView[],
): RadarProfileView[] {
  if (initialProfiles && initialProfiles.length > 0) return initialProfiles;
  return [
    {
      id: "local",
      name: DEFAULT_RADAR_PROFILE_NAME,
      industries: initialIcp.industries,
      countries: initialIcp.countries,
      minEmployees: initialIcp.minEmployees,
      minRevenue: initialIcp.minRevenue,
      greetThreshold: 0,
      isActive: true,
    },
  ];
}

function applyProfileDrafts(profile: RadarProfileView) {
  return {
    industries: profile.industries,
    countries: profile.countries,
    employeesDraft: profile.minEmployees == null ? "" : String(profile.minEmployees),
    revenueDraft: eurosToMillionInput(profile.minRevenue),
    threshold: profile.greetThreshold,
  };
}

export function RadarDashboard({
  points,
  companies,
  initialIcp,
  initialProfiles,
  initialProfileId,
}: {
  points: RadarPoint[];
  companies: IcpCompanyRecord[];
  initialIcp: StoredAccountIcp;
  initialProfiles?: RadarProfileView[];
  initialProfileId?: string;
}) {
  const profiles = profilesFromProps(initialIcp, initialProfiles);
  const startProfile =
    profiles.find((profile) => profile.id === initialProfileId) ?? profiles[0] ?? {
      id: "local",
      name: DEFAULT_RADAR_PROFILE_NAME,
      ...initialIcp,
      greetThreshold: 0,
      isActive: true,
    };
  const startDrafts = applyProfileDrafts(startProfile);
  const [phase, setPhase] = useState<RadarDashboardPhase>("idle");
  const [selectedProfileId, setSelectedProfileId] = useState(startProfile.id);
  const [threshold, setThreshold] = useState(startDrafts.threshold);
  const [query, setQuery] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState(startDrafts.industries);
  const [selectedCountries, setSelectedCountries] = useState(startDrafts.countries);
  const [employeesDraft, setEmployeesDraft] = useState(startDrafts.employeesDraft);
  const [revenueDraft, setRevenueDraft] = useState(startDrafts.revenueDraft);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const icp = useMemo(() => {
    const employees = parseEmployeesDraft(employeesDraft);
    const revenue = parseMillionDraft(revenueDraft);
    return toIcpProfile({
      industries: selectedIndustries,
      countries: selectedCountries,
      minEmployees: employees.ok ? employees.value : null,
      minRevenue: revenue.ok ? revenue.value : null,
    });
  }, [selectedIndustries, selectedCountries, employeesDraft, revenueDraft]);
  const summary = useMemo(
    () => summarizeRadarIcp(companies, points, icp, threshold),
    [companies, points, icp, threshold],
  );
  const listedPoints = useMemo(
    () => filterRadarPointsBySearch(summary.icpPoints, query, threshold),
    [summary.icpPoints, query, threshold],
  );
  const searching = normalizeSearchQuery(query).length > 0;
  const scopeDots = useMemo(() => projectRadarScopeDots(listedPoints), [listedPoints]);
  const mapVisible = isRadarMapVisible(phase);

  useEffect(() => {
    if (phase !== "scanning") return;
    const timer = window.setTimeout(() => {
      setPhase((current) => nextRadarPhaseAfterScan(current));
    }, SCAN_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function startRadar() {
    if (prefersReducedMotion()) {
      setPhase("active");
      return;
    }
    setPhase((current) => nextRadarPhaseAfterStart(current));
  }

  function markDirty() {
    setSaved(false);
    setError(null);
  }

  async function saveIcp() {
    const employees = parseEmployeesDraft(employeesDraft);
    const revenue = parseMillionDraft(revenueDraft);
    if (!employees.ok || !revenue.ok) {
      setError("Bitte gültige Mindestwerte eingeben.");
      setSaved(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const persistable = selectedProfileId !== "local";
      const response = await fetch(
        persistable ? `/api/radar/profiles/${selectedProfileId}` : "/api/account/icp",
        {
          method: persistable ? "PATCH" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            persistable
              ? {
                  industries: selectedIndustries,
                  countries: selectedCountries,
                  minEmployees: employees.value,
                  minRevenue: revenue.value,
                  greetThreshold: threshold,
                }
              : {
                  industries: selectedIndustries,
                  countries: selectedCountries,
                  minEmployees: employees.value,
                  minRevenue: revenue.value,
                },
          ),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setSaved(false);
        setError("ICP konnte nicht gespeichert werden.");
        return;
      }
      const savedProfile = (body as { profile?: RadarProfileView }).profile;
      const savedIcp = savedProfile ?? (body as { icp?: StoredAccountIcp }).icp;
      if (savedIcp) {
        setSelectedIndustries(savedIcp.industries);
        setSelectedCountries(savedIcp.countries);
        setEmployeesDraft(savedIcp.minEmployees == null ? "" : String(savedIcp.minEmployees));
        setRevenueDraft(eurosToMillionInput(savedIcp.minRevenue));
      }
      if (savedProfile) {
        setThreshold(savedProfile.greetThreshold);
      }
      setSaved(true);
    } catch {
      setSaved(false);
      setError("ICP konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <section className="mb-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            Radar
          </p>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-ink sm:text-4xl">
            Dein Markt
            <br />
            im Blick.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
            Aktiviere den Radar und entdecke die aktuell relevanten Unternehmen in deinem Markt.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="radar-scope-frame aspect-square w-full max-w-[22rem]">
            <RadarScope dots={scopeDots} phase={phase} />
          </div>
          <button
            type="button"
            className="btn-primary mt-5 inline-flex items-center gap-2 px-5 tracking-[0.12em]"
            aria-pressed={phase !== "idle"}
            disabled={phase === "scanning"}
            onClick={startRadar}
          >
            {phase === "idle" ? (
              <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current" aria-hidden="true">
                <path d="M2.5 1.2v9.6L11 6 2.5 1.2z" />
              </svg>
            ) : null}
            {radarStartButtonLabel(phase)}
          </button>
        </div>
      </section>

      <div className="mb-6">
        <RadarProfileSelector
          profiles={profiles}
          selectedId={selectedProfileId}
          onChange={(profileId) => {
            const next = profiles.find((profile) => profile.id === profileId);
            if (!next) return;
            const drafts = applyProfileDrafts(next);
            setSelectedProfileId(next.id);
            setSelectedIndustries(drafts.industries);
            setSelectedCountries(drafts.countries);
            setEmployeesDraft(drafts.employeesDraft);
            setRevenueDraft(drafts.revenueDraft);
            setThreshold(drafts.threshold);
            markDirty();
          }}
        />
        <RadarIcpFilters
          companies={companies}
          selectedIndustries={selectedIndustries}
          selectedCountries={selectedCountries}
          employeesDraft={employeesDraft}
          revenueDraft={revenueDraft}
          saving={saving}
          saved={saved}
          error={error}
          knownCompanies={summary.knownCompanies}
          icpMatching={summary.icpMatching}
          onRadar={summary.onRadar}
          onIndustriesChange={(values) => {
            markDirty();
            setSelectedIndustries(values);
          }}
          onCountriesChange={(values) => {
            markDirty();
            setSelectedCountries(values);
          }}
          onEmployeesDraftChange={(value) => {
            markDirty();
            setEmployeesDraft(value);
          }}
          onRevenueDraftChange={(value) => {
            markDirty();
            setRevenueDraft(value);
          }}
          onSave={() => {
            void saveIcp();
          }}
        />
      </div>

      <section className="radar-workspace surface overflow-hidden">
        <div className="grid gap-4 border-b border-line px-5 py-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(14rem,20rem)] lg:items-end">
          <div>
            <RadarSensitivitySlider
              threshold={threshold}
              onChange={setThreshold}
              visibleCount={summary.onRadar}
              searchHitCount={listedPoints.length}
              searching={searching}
            />
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              0 = alle passenden Unternehmen · 50 = ab Greet 50 · 75 = nur passende Unternehmen mit
              Greet ≥ 75 · 100 = nur passende Unternehmen mit Greet = 100
            </p>
          </div>
          <EntitySearchField
            id="radar-company-search"
            value={query}
            onChange={setQuery}
            placeholder="Unternehmen suchen …"
            label="Unternehmen im Radar suchen"
          />
        </div>

        <RadarIcpStats
          knownCompanies={summary.knownCompanies}
          icpMatching={summary.icpMatching}
          onRadar={summary.onRadar}
        />

        <div className="flex flex-wrap items-center gap-4 border-t border-line px-5 py-2.5 text-xs text-ink-muted">
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

        {mapVisible ? (
          <div className="radar-shell overflow-hidden border-t border-line max-lg:min-h-0 lg:h-[min(72vh,760px)] lg:min-h-[420px]">
            <RadarView
              points={summary.icpPoints}
              threshold={threshold}
              query={query}
              onThresholdChange={setThreshold}
              onQueryChange={setQuery}
              hideControls
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
