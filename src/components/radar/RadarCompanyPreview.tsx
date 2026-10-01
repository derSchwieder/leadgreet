"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { SignalTypeBadge } from "@/components/ui/SignalTypeBadge";
import { NEXT_STEP_LABELS, type IntelligenceNextStep } from "@/lib/intelligence/types";
import { formatEnum, displayLocation } from "@/lib/format";
import type { RadarPoint } from "@/lib/radar";
import {
  radarOpportunityCtaLabel,
  radarOpportunityPath,
  resolveRadarOpportunity,
} from "./radar-opportunity";

type PreviewIntelligence = {
  triggerSignal: { title: string; type: string } | null;
  primaryService: { service: { name: string }; matchScore: number } | null;
  matchingContact: { fullName: string; role: string; isDecisionMaker: boolean } | null;
  recommendedContent: {
    item: { id: string; name: string; type: string; url: string | null };
  } | null;
  nextStep: IntelligenceNextStep;
  nextStepReason: string;
};

function signalTitle(title: string | null | undefined): string | null {
  if (!title) return null;
  const cleaned = title.replace(/^\[DEMO\]\s*/, "").trim();
  return cleaned || null;
}

function PreviewBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-line/80 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <div className="mt-0.5 min-w-0 text-[13px] leading-4 text-ink">{children}</div>
    </div>
  );
}

function StatusLine({ children }: { children: string }) {
  return <p className="truncate text-xs text-ink-faint">{children}</p>;
}

export function RadarCompanyPreview({
  point,
  onBack,
}: {
  point: RadarPoint;
  onBack: () => void;
}) {
  const router = useRouter();
  const [intelligence, setIntelligence] = useState<PreviewIntelligence | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [opportunityId, setOpportunityId] = useState<string | null>(null);
  const [screening, setScreening] = useState<{
    id: string;
    status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
    completedAt: string | null;
    result: { error?: { code?: string; message?: string } } | null;
  } | null>(null);
  const [screeningLookup, setScreeningLookup] = useState<"loading" | "ready">("loading");
  const [opportunityLookup, setOpportunityLookup] = useState<"loading" | "ready">("loading");
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setIntelligence(null);
    setOpportunityId(null);
    setScreening(null);
    setScreeningLookup("loading");
    setOpportunityLookup("loading");
    setActionError(null);
    setActionPending(false);

    fetch(`/api/radar/companies/${point.companyId}/intelligence`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("load-failed");
        const body = (await response.json()) as { intelligence: PreviewIntelligence };
        if (controller.signal.aborted) return;
        setIntelligence(body.intelligence);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });

    fetch(`/api/screenings?companyId=${encodeURIComponent(point.companyId)}&limit=1`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("load-failed");
        const body = (await response.json()) as {
          screenings: Array<{
            id: string;
            status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
            completedAt: string | null;
            result: { error?: { code?: string; message?: string } } | null;
          }>;
        };
        if (controller.signal.aborted) return;
        setScreening(body.screenings[0] ?? null);
        setScreeningLookup("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setScreening(null);
        setScreeningLookup("ready");
      });

    fetch(`/api/radar/companies/${point.companyId}/opportunity`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("load-failed");
        const body = (await response.json()) as { opportunityId: string | null };
        if (controller.signal.aborted) return;
        setOpportunityId(body.opportunityId);
        setOpportunityLookup("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setOpportunityId(null);
        setOpportunityLookup("ready");
      });

    return () => controller.abort();
  }, [point.companyId]);

  const trigger = signalTitle(intelligence?.triggerSignal?.title) ?? signalTitle(point.signalTitle);
  const content = intelligence?.recommendedContent?.item;
  const ctaLabel =
    opportunityLookup === "ready"
      ? radarOpportunityCtaLabel(opportunityId)
      : "Opportunity öffnen";

  type ScreeningPreview = {
    id: string;
    status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
    completedAt: string | null;
    result: { error?: { code?: string; message?: string } } | null;
  };

  async function onScreenCompany() {
    if (actionPending || screening?.status === "RUNNING" || screening?.status === "QUEUED") return;
    setActionPending(true);
    setActionError(null);
    try {
      const response = await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: point.name,
          domain: point.website ? new URL(point.website).hostname.replace(/^www\\./, "") : undefined,
          companyId: point.companyId,
        }),
      });
      if (!response.ok) throw new Error("create-failed");
      const body = (await response.json()) as {
        screening: ScreeningPreview;
      };
      setScreening(body.screening);

      const runResponse = await fetch(`/api/screenings/${body.screening.id}/run`, {
        method: "POST",
      });
      if (!runResponse.ok) throw new Error("run-failed");
      const runBody = (await runResponse.json()) as {
        screening: ScreeningPreview;
      };
      setScreening(runBody.screening);
      setActionPending(false);
    } catch {
      setActionError("Das Screening konnte gerade nicht gestartet werden.");
      setActionPending(false);
    }
  }

  async function onOpenOpportunity() {
    if (actionPending) return;
    setActionPending(true);
    setActionError(null);
    try {
      if (opportunityId) {
        router.push(radarOpportunityPath(opportunityId));
        return;
      }
      const resolved = await resolveRadarOpportunity(point.companyId);
      setOpportunityId(resolved.opportunityId);
      router.push(radarOpportunityPath(resolved.opportunityId));
    } catch {
      setActionError("Die Opportunity konnte gerade nicht geöffnet werden.");
      setActionPending(false);
    }
  }

  return (
    <aside className="flex max-h-64 min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-line lg:max-h-none lg:h-full lg:w-[19.5rem] lg:border-l lg:border-t-0">
      <div className="px-4 pt-2.5">
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] leading-4 text-ink-muted transition-colors hover:text-accent"
        >
          ← Zurück zum Radar
        </button>

        <div className="mt-2 flex items-center gap-2">
          <CompanyLogo name={point.name} size="xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-4 text-ink">{point.name}</p>
            <p className="truncate text-[11px] leading-4 text-ink-muted">
              {displayLocation(point.city, point.country)}
            </p>
            {point.website ? (
              <a
                href={point.website}
                target="_blank"
                rel="noopener noreferrer"
                className="link-inline mt-0.5 inline-block text-[11px] leading-4"
              >
                Webseite ↗
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <ScoreBadge score={point.greet} label="Greet" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] leading-3 text-ink-muted">
              Greet
            </p>
            <p className="truncate text-[11px] leading-4 text-ink-muted">aktuelle Vertriebsrelevanz</p>
          </div>
        </div>

        {status === "loading" ? (
          <p className="mt-2 text-xs text-ink-muted">Vertriebsintelligenz wird geladen…</p>
        ) : null}

        {status === "error" ? (
          <p className="mt-2 text-xs text-ink-muted">
            Vertriebsintelligenz konnte nicht geladen werden.
          </p>
        ) : null}

        {status === "ready" && intelligence ? (
          <div className="mt-2.5">
            <PreviewBlock label="Warum relevant?">
              {intelligence.triggerSignal ? (
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0">
                    <SignalTypeBadge type={String(intelligence.triggerSignal.type)} />
                  </span>
                  <p className="min-w-0 truncate">{trigger ?? intelligence.triggerSignal.title}</p>
                </div>
              ) : (
                <StatusLine>Kein öffentliches Signal</StatusLine>
              )}
            </PreviewBlock>

            <PreviewBlock label="Passender Service">
              {intelligence.primaryService ? (
                <p className="truncate font-medium">{intelligence.primaryService.service.name}</p>
              ) : (
                <StatusLine>Kein passender Service</StatusLine>
              )}
            </PreviewBlock>

            <PreviewBlock label="Passender Ansprechpartner">
              {intelligence.matchingContact ? (
                <p className="truncate">
                  {intelligence.matchingContact.fullName}
                  <span className="text-ink-muted">
                    {" "}
                    · {formatEnum(intelligence.matchingContact.role)}
                    {intelligence.matchingContact.isDecisionMaker ? " · Entscheider" : ""}
                  </span>
                </p>
              ) : (
                <StatusLine>Kein passender Kontakt</StatusLine>
              )}
            </PreviewBlock>

            <PreviewBlock label="Empfohlener Inhalt">
              {content ? (
                <div className="flex min-w-0 items-start gap-1.5">
                  <span className="mt-px shrink-0">
                    <ContentTypeBadge type={String(content.type)} />
                  </span>
                  {content.url ? (
                    <a
                      href={content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 min-w-0 font-medium leading-4 text-ink hover:text-accent"
                    >
                      {content.name}
                    </a>
                  ) : (
                    <Link
                      href={`/content/${content.id}`}
                      className="line-clamp-2 min-w-0 font-medium leading-4 text-ink hover:text-accent"
                    >
                      {content.name}
                    </Link>
                  )}
                </div>
              ) : (
                <StatusLine>Kein passender Inhalt</StatusLine>
              )}
            </PreviewBlock>

            <PreviewBlock label="Nächster Schritt">
              <p className="truncate font-medium">{NEXT_STEP_LABELS[intelligence.nextStep]}</p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-ink-muted">
                {intelligence.nextStepReason}
              </p>
            </PreviewBlock>
          </div>
        ) : null}
      </div>

      {screeningLookup === "ready" ? (
        <div className="mx-4 mt-2">
          <PreviewBlock label="Screening">
            {screening?.status === "FAILED" && screening.result?.error ? (
              <div>
                <p>Screening fehlgeschlagen</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {screening.result.error.code ?? "UNBEKANNTER_FEHLER"}
                  {screening.result.error.message ? ` · ${screening.result.error.message}` : ""}
                </p>
              </div>
            ) : screening?.completedAt ? (
              <p>Zuletzt gescreent: {new Intl.DateTimeFormat("de-DE").format(new Date(screening.completedAt))}</p>
            ) : screening ? (
              <p>Screening-Status: {screening.status}</p>
            ) : (
              <StatusLine>Noch nicht gescreent</StatusLine>
            )}
          </PreviewBlock>
        </div>
      ) : null}

      <div className="mx-4 mb-3 mt-2 shrink-0 space-y-2">
        <button
          type="button"
          onClick={() => void onScreenCompany()}
          disabled={
            actionPending ||
            screening?.status === "RUNNING" ||
            screening?.status === "QUEUED" ||
            screeningLookup === "loading"
          }
          className="inline-flex w-full justify-center rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60"
        >
          {screening?.status === "RUNNING" || screening?.status === "QUEUED"
            ? "Screening läuft…"
            : actionPending
              ? "Screening wird gestartet…"
              : screening?.status === "COMPLETED"
                ? "Neu screenen"
                : "Unternehmen screenen"}
        </button>
        <button
          type="button"
          onClick={() => void onOpenOpportunity()}
          disabled={actionPending}
          className="inline-flex w-full justify-center rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-canvas transition hover:bg-[#3ad7be] disabled:cursor-wait disabled:opacity-70"
        >
          {actionPending ? "Opportunity wird geöffnet…" : ctaLabel}
        </button>
        {actionError ? (
          <p role="alert" className="text-[11px] leading-4 text-ink-muted">
            {actionError}
          </p>
        ) : null}
        <Link
          href={`/companies/${point.companyId}`}
          className="link-inline block text-center text-[11px]"
        >
          Unternehmen öffnen
        </Link>
      </div>
    </aside>
  );
}
