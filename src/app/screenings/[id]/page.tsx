"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CompanyScreeningResultPayload } from "@/types";
import { CompanyLogo } from "@/components/ui/CompanyLogo";


type GlyphName = "alert" | "building" | "check" | "clock" | "file" | "idea" | "link" | "radar" | "target" | "users";
function Glyph({ name, size = 19, className = "" }: { name: GlyphName; size?: number; className?: string }) {
  const symbols: Record<GlyphName, string> = {
    alert: "!", building: "▦", check: "✓", clock: "◷", file: "▤",
    idea: "✦", link: "↗", radar: "◎", target: "⊙", users: "♙",
  };
  return <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center font-semibold leading-none ${className}`} style={{ width: size, height: size, fontSize: size * 0.9 }}>{symbols[name]}</span>;
}

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

function Section({ title, children, icon: Icon, tone = "slate", id }: { title: string; children: ReactNode; icon?: GlyphName; tone?: "slate" | "teal" | "blue" | "violet" | "amber" | "rose"; id?: string }) {
  const tones = {
    slate: "border-slate-500/30 bg-slate-500/[0.06] text-slate-300",
    teal: "border-teal-400/30 bg-teal-400/[0.07] text-teal-300",
    blue: "border-sky-400/30 bg-sky-400/[0.07] text-sky-300",
    violet: "border-violet-400/30 bg-violet-400/[0.07] text-violet-300",
    amber: "border-amber-400/30 bg-amber-400/[0.07] text-amber-300",
    rose: "border-rose-400/30 bg-rose-400/[0.07] text-rose-300",
  };
  return <section id={id} className={`surface scroll-mt-6 overflow-hidden rounded-2xl border border-line/70 shadow-sm`}>
    <div className={`flex items-center gap-3 border-b px-6 py-4 md:px-7 ${tones[tone]}`}>
      {Icon ? <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-black/10"><Glyph name={Icon} size={19} /></span> : null}
      <h2 className="text-sm font-bold uppercase tracking-[0.12em]">{title}</h2>
    </div>
    <div className="p-6 md:p-7">{children}</div>
  </section>;
}

function Source({ title, url, detail }: { title: string; url?: string | null; detail?: string | null }) {
  return <li className="mt-3 flex gap-3 rounded-xl border border-line/70 bg-black/[0.08] p-4 first:mt-3"><Glyph name="link" size={17} className="mt-0.5 text-teal-300" /> <div className="min-w-0">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-base font-semibold leading-6 text-ink hover:text-teal-300">{title || url} ↗</a> : <p className="text-base font-semibold leading-6 text-ink">{title || "Quelle ohne Titel"}</p>}{detail ? <p className="mt-2 text-sm text-ink-muted">{detail}</p> : null}</div></li>;
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
  if (loadError || !screening) return <div className="mx-auto max-w-4xl p-6"><Link href="/radar" className="link-inline text-base">← Zurück zum Radar</Link><div className="surface mt-5 p-5"><h1 className="text-lg font-semibold text-ink">Ergebnis konnte nicht geladen werden</h1><p className="mt-2 text-sm text-ink-muted">Bitte prüfe, ob das Screening verfügbar ist, und versuche es erneut.</p></div></div>;

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
  const icpAssessment = analysis?.icpAssessment ?? null;
  const icpFit = icpAssessment
    ? (icpAssessment.criteria.some((criterion) => criterion.status === "supported") ? "Ja" : "Nein")
    : result?.icpAssessment
      ? (result.icpAssessment.overallFit != null && /fit|match|pass|hoch|gut|ja|true/i.test(String(result.icpAssessment.overallFit)) ? "Ja" : "Nein")
      : "Nein";
  const statusLabel = { QUEUED: "In Warteschlange", RUNNING: "Läuft", COMPLETED: "Abgeschlossen", FAILED: "Fehlgeschlagen" }[screening.status];

  return <div className="mx-auto max-w-5xl space-y-6 p-5 md:p-10">
    <Link href="/radar" className="link-inline text-base">← Zurück zum Radar</Link>
    <header className="relative overflow-hidden rounded-2xl border border-teal-400/25 bg-gradient-to-br from-teal-400/[0.12] via-sky-400/[0.06] to-transparent p-6 pb-6 md:p-8">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-teal-300"><Glyph name="radar" size={18} /> Screening-Ergebnis</div>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-4"><CompanyLogo name={screening.inputName} size="md" /><div className="min-w-0"><h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{screening.inputName}</h1>{screening.inputDomain ? <p className="mt-2 text-base text-ink-muted">{screening.inputDomain}</p> : null}</div></div><span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${screening.status === "COMPLETED" ? "border-teal-400/40 bg-teal-400/10 text-teal-300" : screening.status === "FAILED" ? "border-rose-400/40 bg-rose-400/10 text-rose-300" : "border-amber-400/40 bg-amber-400/10 text-amber-300"}`}>{screening.status === "COMPLETED" ? <Glyph name="check" size={16} /> : screening.status === "FAILED" ? <Glyph name="alert" size={16} /> : <Glyph name="clock" size={16} />}{statusLabel}</span></div>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted"><span className="inline-flex items-center gap-2"><Glyph name="clock" size={15} className="text-teal-300" />Gestartet: {dateLabel(screening.startedAt)}</span><span className="inline-flex items-center gap-2"><Glyph name="check" size={15} className="text-teal-300" />Abgeschlossen: {dateLabel(screening.completedAt)}</span></div>
    </header>

    <section aria-label="Screening-Kurzüberblick" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        { label: "ICP-Fit", value: icpFit, icon: "target" as const, target: "icp-fit", tone: icpFit === "Ja" ? "text-teal-300 border-teal-400/25 bg-teal-400/[0.07]" : "text-slate-300 border-slate-500/25 bg-slate-500/[0.06]" },
        { label: "Signale", value: String(signals.length || result?.signals?.length || 0), icon: "radar" as const, target: "signals", tone: "text-teal-300 border-teal-400/25 bg-teal-400/[0.07]" },
        { label: "Saleschancen", value: String(hypotheses.length), icon: "idea" as const, target: "sales-chances", tone: "text-violet-300 border-violet-400/25 bg-violet-400/[0.07]" },
        { label: "Ansprechpartner", value: String(contacts.length), icon: "users" as const, target: "contacts", tone: "text-sky-300 border-sky-400/25 bg-sky-400/[0.07]" },
      ].map((item) => <button key={item.label} type="button" onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" })} aria-label={`${item.label}: zum Ergebnis springen`} className={`cursor-pointer rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-current/50 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 md:p-5 ${item.tone}`}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] md:text-sm"><Glyph name={item.icon} size={17} />{item.label}</div>
        <div className="mt-3 flex items-center justify-between text-2xl font-bold text-ink md:text-3xl">{item.value}<span className="text-sm opacity-60" aria-hidden="true">↘</span></div>
      </button>)}
    </section>

    {result?.error ? <Section title="Fehler" icon="alert" tone="rose"><p className="text-base font-semibold leading-6 text-ink">{result.error.code}</p><p className="mt-2 text-base leading-6 text-ink-muted">{result.error.message}</p><p className="mt-3 text-sm text-ink-muted">Für diesen Lauf liegt kein vollständiges Screening-Ergebnis vor.</p></Section> : null}
    {screening.status === "COMPLETED" && !analysis && !result?.signals?.length ? <Section title="Ergebnisstatus" icon="file" tone="amber"><p className="text-sm text-ink-muted">Das Screening ist abgeschlossen, enthält aber keine auswertbaren Analyse-Daten.</p></Section> : null}

    {profile ? <Section title="Unternehmensprofil" icon="building" tone="blue"><p className="text-base leading-7 text-ink">{profile.summary}</p><dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">{profile.industry ? <div><dt className="text-sm font-medium text-ink-muted">Branche</dt><dd className="mt-1 text-base leading-6 text-ink">{profile.industry}</dd></div> : null}{profile.businessModel ? <div><dt className="text-sm font-medium text-ink-muted">Geschäftsmodell</dt><dd className="mt-1 text-base leading-6 text-ink">{profile.businessModel}</dd></div> : null}{profile.size ? <div><dt className="text-sm font-medium text-ink-muted">Größe</dt><dd className="mt-1 text-base leading-6 text-ink">{profile.size}</dd></div> : null}{profile.revenue ? <div><dt className="text-sm font-medium text-ink-muted">Umsatz</dt><dd className="mt-1 text-base leading-6 text-ink">{profile.revenue}</dd></div> : null}{profile.technologyProfile ? <div><dt className="text-sm font-medium text-ink-muted">Technologieprofil</dt><dd className="mt-1 text-base leading-6 text-ink">{profile.technologyProfile}</dd></div> : null}{profile.transformationProfile ? <div><dt className="text-sm font-medium text-ink-muted">Transformation</dt><dd className="mt-1 text-base leading-6 text-ink">{profile.transformationProfile}</dd></div> : null}</dl></Section> : null}

    <Section id="signals" title={`Erkannte Signale · ${signals.length + (signals.length ? 0 : result?.signals?.length ?? 0)}` icon="radar" tone="teal">
      {signals.length ? <ul>{signals.map((signal, i) => <li key={`${signal.title}-${i}`} className="mt-4 rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-5 first:mt-0"><div className="flex flex-wrap items-center gap-2"><p className="text-base font-semibold leading-6 text-ink">{signal.title}</p><span className="rounded-md border border-teal-400/25 bg-teal-400/10 px-2.5 py-1 text-xs font-semibold text-teal-300">{signal.strength} · {signal.category}</span></div><p className="mt-2 text-base leading-7 text-ink-muted">{signal.description}</p>{signal.evidence.map((e, j) => <Source key={`${e.url}-${j}`} title={e.title ?? e.publisher ?? e.url} url={e.url} detail={e.publishedAt} />)}</li>)}</ul> : result?.signals?.length ? <ul>{result.signals.map((s, i) => <li key={i} className="mt-4 rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-5 first:mt-0"><p className="text-base font-semibold leading-6 text-ink">{s.title ?? "Signal ohne Titel"}</p>{s.description ? <p className="mt-2 text-base leading-6 text-ink-muted">{s.description}</p> : null}{s.sourceUrl ? <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="link-inline mt-1 inline-block text-xs">Quelle öffnen ↗</a> : null}</li>)}</ul> : <p className="text-sm text-ink-muted">Keine auswertbaren Signale in diesem Screening gefunden.</p>}
    </Section>

    <Section id="sales-chances" title={`Mögliche Sales-Chancen · ${hypotheses.length}` icon="idea" tone="violet">{hypotheses.length ? <ul className="space-y-6">{hypotheses.map((item, i) => <li key={`${item.title}-${i}`} className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-5 first:mt-0"><p className="text-base font-semibold leading-6 text-ink">{item.title}</p><p className="mt-2 text-base leading-7 text-ink">{item.hypothesis}</p><p className="mt-2 text-sm leading-5 text-ink-muted">{item.rationale}</p><p className="mt-3 text-sm text-ink-muted">Relevanz: {item.relevance}</p>{item.evidence.map((e, j) => <Source key={`${e.url}-${j}`} title={e.title ?? e.publisher ?? e.url} url={e.url} detail={e.publishedAt} />)}</li>)}</ul> : <p className="text-sm text-ink-muted">Keine Sales-Hypothesen im Ergebnis vorhanden.</p>}</Section>

    <Section id="contacts" title={`Relevante Ansprechpartner · ${contacts.length}` icon="users" tone="blue">{contacts.length ? <ul>{contacts.map((c, i) => <li key={`${c.name}-${i}`} className="mt-4 rounded-xl border border-sky-400/20 bg-sky-400/[0.04] p-5 first:mt-0"><p className="text-base font-semibold leading-6 text-ink">{c.name}</p><p className="mt-2 text-base leading-6 text-ink-muted">{c.role} · Relevanz: {c.relevance}</p><p className="mt-2 text-base leading-6 text-ink-muted">{c.relevanceReason}</p>{c.profileUrl ? <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="link-inline mt-1 inline-block text-xs">Profil öffnen ↗</a> : null}{c.evidence.map((e, j) => <Source key={`${e.url}-${j}`} title={e.title ?? e.publisher ?? e.url} url={e.url} detail={e.publishedAt} />)}</li>)}</ul> : <p className="text-sm text-ink-muted">Keine relevanten Ansprechpartner im Screening-Ergebnis ausgewiesen.</p>}</Section>

    {analysis?.icpAssessment ? <Section id="icp-fit" title="ICP-Fit" icon="target" tone="amber"><p className="text-sm leading-5 text-ink">{analysis.icpAssessment.summary}</p><p className="mt-3 text-sm text-ink-muted">Einschätzung: {analysis.icpAssessment.confidence}</p><ul className="mt-4 space-y-4">{analysis.icpAssessment.criteria.map((c) => <li key={c.criterion} className="border-t border-line/70 pt-4 first:border-t-0"><div className="flex flex-wrap justify-between gap-2"><p className="text-base font-semibold leading-6 text-ink">{c.criterion}</p><span className="text-sm font-medium text-ink-muted">{c.status}</span></div><p className="mt-2 text-base leading-6 text-ink-muted">{c.finding}</p></li>)}</ul></Section> : result?.icpAssessment ? <Section id="icp-fit" title="ICP-Fit">{result.icpAssessment.overallFit != null ? <p className="text-sm text-ink">Gesamteinschätzung: {String(result.icpAssessment.overallFit)}</p> : null}<ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-ink-muted">{[...(result.icpAssessment.reasons ?? []), ...(result.icpAssessment.risks ?? []).map((x) => `Risiko: ${x}`), ...(result.icpAssessment.mismatches ?? []).map((x) => `Abweichung: ${x}`)].map((x, i) => <li key={i}>{x}</li>)}</ul></Section> : null}

    {sources.length ? <details className="surface group overflow-hidden rounded-2xl border border-line/70 shadow-sm"><summary className="flex cursor-pointer list-none items-center gap-3 border-b border-slate-500/30 bg-slate-500/[0.06] px-6 py-4 text-slate-300 marker:hidden md:px-7"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-black/10"><Glyph name="link" size={19} /></span><span className="text-sm font-bold uppercase tracking-[0.12em]">Recherchequellen · {sources.length}</span><span className="ml-auto text-sm font-medium normal-case tracking-normal text-ink-muted group-open:hidden">Quellen anzeigen</span><span className="ml-auto hidden text-sm font-medium normal-case tracking-normal text-ink-muted group-open:inline">Quellen ausblenden</span><span aria-hidden="true" className="ml-2 text-lg transition-transform group-open:rotate-180">⌄</span></summary><div className="p-6 md:p-7"><p className="mb-3 text-sm text-ink-muted">Die Recherche hat {sources.length} Quellen gefunden. Wähle einen Eintrag, um die Originalquelle zu öffnen.</p><ul>{sources.map((s, i) => <Source key={`${s.url ?? s.title}-${i}`} title={s.title} url={s.url} detail={s.detail} />)}</ul></div></details> : null}
    {(analysis?.limitations?.length || result?.limitations?.length || result?.contactResearch?.limitations?.length) ? <Section title="Einschränkungen der Recherche" icon="alert" tone="amber"><ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">{[...(analysis?.limitations ?? []), ...(result?.limitations ?? []), ...(result?.contactResearch?.limitations ?? [])].filter((x, i, all) => all.indexOf(x) === i).map((x, i) => <li key={i}>{x}</li>)}</ul></Section> : null}

    <footer className="flex flex-wrap gap-3 pb-8"><Link href="/radar" className="rounded-lg border border-line px-5 py-3 text-base font-medium text-ink hover:border-accent">Zurück zum Radar</Link>{screening.companyId ? <Link href={`/companies/${screening.companyId}`} className="rounded-lg bg-accent px-5 py-3 text-base font-semibold text-canvas hover:bg-[#3ad7be]">Unternehmen öffnen</Link> : null}</footer>
  </div>;
}
