"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { CompanyScreeningResultPayload } from "@/types";

type ScreeningView = {
  id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  inputName: string;
  inputDomain: string | null;
  companyId: string | null;
  startedAt: string;
  completedAt: string | null;
  result: CompanyScreeningResultPayload | null;
};

function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="surface p-5"><h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{title}</h2>{children}</section>;
}

function Source({ title, url, detail }: { title: string; url?: string | null; detail?: string | null }) {
  return <li className="border-t border-line/70 py-3 first:border-t-0">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-ink hover:text-accent">{title || url} ↗</a> : <p className="text-sm font-medium text-ink">{title || "Quelle ohne Titel"}</p>}{detail ? <p className="mt-1 text-xs text-ink-muted">{detail}</p> : null}</li>;
}

export default function ScreeningResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [screening, setScreening] = useState<ScreeningView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/screenings/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("load-failed");
        const body = (await response.json()) as { screening: ScreeningView };
        if (!controller.signal.aborted) { setScreening(body.screening); setLoadError(false); }
      })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  if (loading) return <div className="mx-auto max-w-4xl p-6 text-sm text-ink-muted">Screening-Ergebnis wird geladen…</div>;
  if (loadError || !screening) return <div className="mx-auto max-w-4xl p-6"><Link href="/radar" className="link-inline text-sm">← Zurück zum Radar</Link><div className="surface mt-5 p-5"><h1 className="text-lg font-semibold text-ink">Ergebnis konnte nicht geladen werden</h1><p className="mt-2 text-sm text-ink-muted">Bitte prüfe, ob das Screening verfügbar ist, und versuche es erneut.</p></div></div>;

  const result = screening.result;
  const analysis = result?.analysis;
  const signals = analysis?.signals ?? [];
  const hypotheses = analysis?.salesHypotheses ?? [];
  const contacts = analysis?.relevantContacts ?? [];
  const profile = analysis?.companyProfile;
  const sources = [
    ...(result?.sources ?? []).map((s) => ({ title: s.title, url: s.url, detail: [s.publisher, s.publishedAt].filter(Boolean).join(" · ") })),
    ...(result?.research?.results ?? []).map((s) => ({ title: s.title, url: s.url, detail: [s.source, s.publishedAt].filter(Boolean).join(" · ") })),
  ].filter((s, i, all) => all.findIndex((other) => other.url === s.url && other.title === s.title) === i);
  const statusLabel = { QUEUED: "In Warteschlange", RUNNING: "Läuft", COMPLETED: "Abgeschlossen", FAILED: "Fehlgeschlagen" }[screening.status];

  return <div className="mx-auto max-w-4xl space-y-5 p-5 md:p-8">
    <Link href="/radar" className="link-inline text-sm">← Zurück zum Radar</Link>
    <header className="border-b border-line pb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Screening-Ergebnis</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight text-ink">{screening.inputName}</h1>{screening.inputDomain ? <p className="mt-1 text-sm text-ink-muted">{screening.inputDomain}</p> : null}</div><span className={`rounded-full border px-3 py-1 text-xs font-medium ${screening.status === "COMPLETED" ? "border-accent/50 text-accent" : screening.status === "FAILED" ? "border-red-500/50 text-red-500" : "border-line text-ink-muted"}`}>{statusLabel}</span></div>
      <p className="mt-3 text-xs text-ink-muted">Gestartet: {dateLabel(screening.startedAt)} · Abgeschlossen: {dateLabel(screening.completedAt)}</p>
    </header>

    {result?.error ? <Section title="Fehler"><p className="text-sm font-medium text-ink">{result.error.code}</p><p className="mt-1 text-sm text-ink-muted">{result.error.message}</p><p className="mt-3 text-sm text-ink-muted">Für diesen Lauf liegt kein vollständiges Screening-Ergebnis vor.</p></Section> : null}
    {screening.status === "COMPLETED" && !analysis && !result?.signals?.length ? <Section title="Ergebnisstatus"><p className="text-sm text-ink-muted">Das Screening ist abgeschlossen, enthält aber keine auswertbaren Analyse-Daten.</p></Section> : null}

    {profile ? <Section title="Unternehmensprofil"><p className="text-sm leading-6 text-ink">{profile.summary}</p><dl className="mt-4 grid gap-3 sm:grid-cols-2">{profile.industry ? <div><dt className="text-xs text-ink-muted">Branche</dt><dd className="mt-1 text-sm text-ink">{profile.industry}</dd></div> : null}{profile.businessModel ? <div><dt className="text-xs text-ink-muted">Geschäftsmodell</dt><dd className="mt-1 text-sm text-ink">{profile.businessModel}</dd></div> : null}{profile.size ? <div><dt className="text-xs text-ink-muted">Größe</dt><dd className="mt-1 text-sm text-ink">{profile.size}</dd></div> : null}{profile.revenue ? <div><dt className="text-xs text-ink-muted">Umsatz</dt><dd className="mt-1 text-sm text-ink">{profile.revenue}</dd></div> : null}{profile.technologyProfile ? <div><dt className="text-xs text-ink-muted">Technologieprofil</dt><dd className="mt-1 text-sm text-ink">{profile.technologyProfile}</dd></div> : null}{profile.transformationProfile ? <div><dt className="text-xs text-ink-muted">Transformation</dt><dd className="mt-1 text-sm text-ink">{profile.transformationProfile}</dd></div> : null}</dl></Section> : null}

    <Section title={`Erkannte Signale · ${signals.length + (signals.length ? 0 : result?.signals?.length ?? 0)}`}>
      {signals.length ? <ul>{signals.map((signal, i) => <li key={`${signal.title}-${i}`} className="border-t border-line/70 py-3 first:border-t-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-ink">{signal.title}</p><span className="rounded border border-line px-2 py-0.5 text-[10px] text-ink-muted">{signal.strength} · {signal.category}</span></div><p className="mt-1 text-sm leading-5 text-ink-muted">{signal.description}</p>{signal.evidence.map((e, j) => <Source key={`${e.url}-${j}`} title={e.title ?? e.publisher ?? e.url} url={e.url} detail={e.publishedAt} />)}</li>)}</ul> : result?.signals?.length ? <ul>{result.signals.map((s, i) => <li key={i} className="border-t border-line/70 py-3 first:border-t-0"><p className="text-sm font-medium text-ink">{s.title ?? "Signal ohne Titel"}</p>{s.description ? <p className="mt-1 text-sm text-ink-muted">{s.description}</p> : null}{s.sourceUrl ? <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="link-inline mt-1 inline-block text-xs">Quelle öffnen ↗</a> : null}</li>)}</ul> : <p className="text-sm text-ink-muted">Keine auswertbaren Signale in diesem Screening gefunden.</p>}
    </Section>

    <Section title={`Mögliche Sales-Chancen · ${hypotheses.length}`}>{hypotheses.length ? <ul className="space-y-4">{hypotheses.map((item, i) => <li key={`${item.title}-${i}`} className="border-t border-line/70 pt-3 first:border-t-0 first:pt-0"><p className="text-sm font-semibold text-ink">{item.title}</p><p className="mt-1 text-sm leading-5 text-ink">{item.hypothesis}</p><p className="mt-2 text-sm leading-5 text-ink-muted">{item.rationale}</p><p className="mt-2 text-xs text-ink-muted">Relevanz: {item.relevance}</p>{item.evidence.map((e, j) => <Source key={`${e.url}-${j}`} title={e.title ?? e.publisher ?? e.url} url={e.url} detail={e.publishedAt} />)}</li>)}</ul> : <p className="text-sm text-ink-muted">Keine Sales-Hypothesen im Ergebnis vorhanden.</p>}</Section>

    <Section title={`Relevante Ansprechpartner · ${contacts.length}`}>{contacts.length ? <ul>{contacts.map((c, i) => <li key={`${c.name}-${i}`} className="border-t border-line/70 py-3 first:border-t-0"><p className="text-sm font-medium text-ink">{c.name}</p><p className="mt-1 text-sm text-ink-muted">{c.role} · Relevanz: {c.relevance}</p><p className="mt-1 text-sm text-ink-muted">{c.relevanceReason}</p>{c.profileUrl ? <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="link-inline mt-1 inline-block text-xs">Profil öffnen ↗</a> : null}{c.evidence.map((e, j) => <Source key={`${e.url}-${j}`} title={e.title ?? e.publisher ?? e.url} url={e.url} detail={e.publishedAt} />)}</li>)}</ul> : <p className="text-sm text-ink-muted">Keine relevanten Ansprechpartner im Screening-Ergebnis ausgewiesen.</p>}</Section>

    {analysis?.icpAssessment ? <Section title="ICP-Fit"><p className="text-sm leading-5 text-ink">{analysis.icpAssessment.summary}</p><p className="mt-2 text-xs text-ink-muted">Einschätzung: {analysis.icpAssessment.confidence}</p><ul className="mt-3 space-y-3">{analysis.icpAssessment.criteria.map((c) => <li key={c.criterion} className="border-t border-line/70 pt-3 first:border-t-0"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-medium text-ink">{c.criterion}</p><span className="text-xs text-ink-muted">{c.status}</span></div><p className="mt-1 text-sm text-ink-muted">{c.finding}</p></li>)}</ul></Section> : result?.icpAssessment ? <Section title="ICP-Fit">{result.icpAssessment.overallFit != null ? <p className="text-sm text-ink">Gesamteinschätzung: {String(result.icpAssessment.overallFit)}</p> : null}<ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">{[...(result.icpAssessment.reasons ?? []), ...(result.icpAssessment.risks ?? []).map((x) => `Risiko: ${x}`), ...(result.icpAssessment.mismatches ?? []).map((x) => `Abweichung: ${x}`)].map((x, i) => <li key={i}>{x}</li>)}</ul></Section> : null}

    {sources.length ? <Section title={`Recherchequellen · ${sources.length}`}><ul>{sources.map((s, i) => <Source key={`${s.url ?? s.title}-${i}`} title={s.title} url={s.url} detail={s.detail} />)}</ul></Section> : null}
    {(analysis?.limitations?.length || result?.limitations?.length || result?.contactResearch?.limitations?.length) ? <Section title="Einschränkungen der Recherche"><ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">{[...(analysis?.limitations ?? []), ...(result?.limitations ?? []), ...(result?.contactResearch?.limitations ?? [])].filter((x, i, all) => all.indexOf(x) === i).map((x, i) => <li key={i}>{x}</li>)}</ul></Section> : null}

    <footer className="flex flex-wrap gap-3 pb-8"><Link href="/radar" className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:border-accent">Zurück zum Radar</Link>{screening.companyId ? <Link href={`/companies/${screening.companyId}`} className="rounded-lg bg-accent px-4 py-2 text-sm text-canvas hover:bg-[#3ad7be]">Unternehmen öffnen</Link> : null}</footer>
  </div>;
}
