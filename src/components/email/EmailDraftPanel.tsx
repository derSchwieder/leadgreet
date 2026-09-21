"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  composeEmailDraft,
  formatEmailDraftForCopy,
  type EmailDraft,
  type EmailDraftInput,
} from "@/lib/email";
import { BUSINESS_CASE_LABELS } from "@/lib/labels";

function EmailDraftView({ draft }: { draft: EmailDraft }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Betreff
        </h3>
        <p className="mt-2 text-base font-medium leading-7 text-ink">{draft.subject}</p>
      </div>

      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Nachricht
        </h3>
        <div className="mt-3 whitespace-pre-wrap rounded-xl bg-canvas-elevated/80 px-4 py-4 text-sm leading-7 text-ink">
          {draft.fullText}
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Business Case
          </dt>
          <dd className="mt-1.5 text-ink-muted">
            {draft.businessCaseType
              ? (BUSINESS_CASE_LABELS[draft.businessCaseType] ?? draft.businessCaseType)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Service
          </dt>
          <dd className="mt-1.5 text-ink-muted">{draft.serviceName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            Anlass
          </dt>
          <dd className="mt-1.5 text-ink-muted">{draft.basis.signal ?? "—"}</dd>
        </div>
      </dl>

      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          Grundlage des Entwurfs
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm leading-6 text-ink-muted">
          <li>Signal: {draft.basis.signal ?? "kein belastbares Signal"}</li>
          <li>
            {draft.basis.businessCase ?? "kein belastbarer Business Case"}
          </li>
          <li>
            Value Proposition: {draft.basis.valueProposition ?? "—"}
          </li>
          <li>Service: {draft.basis.service ?? "—"}</li>
        </ul>
      </div>
    </div>
  );
}

export function EmailDraftPanel({ input }: { input: EmailDraftInput }) {
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [copied, setCopied] = useState(false);

  function createDraft() {
    setCopied(false);
    setDraft(composeEmailDraft(input));
  }

  async function copyDraft() {
    if (!draft) return;
    const text = formatEmailDraftForCopy(draft);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section id="gespraech-vorbereiten" className="surface-featured scroll-mt-24 border-accent/40 p-6 sm:p-7">
      <SectionHeading>Gespräch vorbereiten</SectionHeading>
      <p className="mb-5 text-sm leading-6 text-ink-muted">
        Leadgreet erzeugt aus Signal, möglichem Business Case und Service einen kurzen
        E-Mail-Entwurf. Es wird nichts versendet.
      </p>

      {!draft ? (
        <button type="button" className="btn-primary" onClick={createDraft}>
          E-Mail-Entwurf erstellen
        </button>
      ) : (
        <div className="space-y-6">
          <EmailDraftView draft={draft} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-ghost" onClick={createDraft}>
              Entwurf neu erstellen
            </button>
            <button type="button" className="btn-primary" onClick={() => void copyDraft()}>
              {copied ? "Kopiert" : "Text kopieren"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export { EmailDraftView };
