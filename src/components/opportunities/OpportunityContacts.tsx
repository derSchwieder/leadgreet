"use client";

import { useEffect, useState } from "react";
import { ContactForm, type ContactFormValue } from "@/components/contacts/ContactForm";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatEnum } from "@/lib/format";

export type OpportunityContactCard = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  isDecisionMaker: boolean;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  department: string | null;
  notes: string | null;
  isSeed: boolean;
};

function toContactCards(payload: unknown): OpportunityContactCard[] {
  if (!payload || typeof payload !== "object" || !("contacts" in payload)) return [];
  const contacts = (payload as { contacts?: unknown }).contacts;
  if (!Array.isArray(contacts)) return [];
  return contacts.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const contact = item as Record<string, unknown>;
    if (typeof contact.id !== "string" || typeof contact.fullName !== "string") return [];
    return [
      {
        id: contact.id,
        firstName: typeof contact.firstName === "string" ? contact.firstName : "",
        lastName: typeof contact.lastName === "string" ? contact.lastName : "",
        fullName: contact.fullName,
        role: typeof contact.role === "string" ? contact.role : "OTHER",
        isDecisionMaker: contact.isDecisionMaker === true,
        email: typeof contact.email === "string" ? contact.email : null,
        phone: typeof contact.phone === "string" ? contact.phone : null,
        linkedinUrl: typeof contact.linkedinUrl === "string" ? contact.linkedinUrl : null,
        department: typeof contact.department === "string" ? contact.department : null,
        notes: typeof contact.notes === "string" ? contact.notes : null,
        isSeed: contact.isSeed === true,
      },
    ];
  });
}

function ContactDetails({ contact }: { contact: OpportunityContactCard }) {
  const roleLine = [formatEnum(contact.role), contact.isDecisionMaker ? "Entscheider" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-1.5">
      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
        {contact.fullName}
        {contact.isSeed ? <DemoBadge /> : null}
      </p>
      <p className="text-sm text-ink-muted">{roleLine}</p>
      {contact.department ? <p className="text-xs text-ink-faint">{contact.department}</p> : null}
      {contact.email ? (
        <p className="text-sm text-ink-muted">
          <a href={`mailto:${contact.email}`} className="link-inline">
            {contact.email}
          </a>
        </p>
      ) : null}
      {contact.phone ? <p className="text-sm text-ink-muted">{contact.phone}</p> : null}
      {contact.linkedinUrl ? (
        <p className="text-sm">
          <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="link-inline">
            LinkedIn
          </a>
        </p>
      ) : null}
      {contact.notes ? <p className="text-sm leading-5 text-ink-muted">{contact.notes}</p> : null}
    </div>
  );
}

export function OpportunityContacts({
  companyId,
  canMutate,
  contacts: initialContacts,
  recommendedContactId,
}: {
  companyId: string;
  canMutate: boolean;
  contacts: OpportunityContactCard[];
  recommendedContactId: string | null;
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<OpportunityContactCard | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<OpportunityContactCard | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removePending, setRemovePending] = useState(false);

  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  useEffect(() => {
    async function reload() {
      const response = await fetch(`/api/contacts?companyId=${encodeURIComponent(companyId)}`);
      if (!response.ok) return;
      const payload: unknown = await response.json();
      setContacts(toContactCards(payload));
    }

    window.addEventListener("leadgreet:workbench-refresh", reload);
    return () => window.removeEventListener("leadgreet:workbench-refresh", reload);
  }, [companyId]);

  const recommended = recommendedContactId
    ? contacts.find((contact) => contact.id === recommendedContactId)
    : undefined;
  const others = contacts.filter((contact) => contact.id !== recommended?.id);
  const ordered = recommended ? [recommended, ...others] : others;

  function openCreate() {
    setEditing(null);
    setError(null);
    setFormMode("create");
  }

  function openEdit(contact: OpportunityContactCard) {
    setEditing(contact);
    setError(null);
    setFormMode("edit");
  }

  async function saveContact(value: ContactFormValue) {
    setPending(true);
    setError(null);
    try {
      const isEdit = formMode === "edit" && editing;
      const response = await fetch(isEdit ? `/api/contacts/${editing.id}` : "/api/contacts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? {} : { companyId }),
          firstName: value.firstName,
          lastName: value.lastName,
          role: value.role,
          email: value.email,
          phone: value.phone,
          notes: value.notes,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Der Kontakt konnte nicht gespeichert werden.");
        return;
      }
      window.dispatchEvent(new Event("leadgreet:workbench-refresh"));
      setFormMode(null);
      setEditing(null);
    } catch {
      setError("Der Kontakt konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setRemovePending(true);
    setRemoveError(null);
    try {
      const response = await fetch(`/api/contacts/${removing.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setRemoveError(payload.error ?? "Der Kontakt konnte nicht entfernt werden.");
        return;
      }
      window.dispatchEvent(new Event("leadgreet:workbench-refresh"));
      setRemoving(null);
    } catch {
      setRemoveError("Der Kontakt konnte nicht entfernt werden.");
    } finally {
      setRemovePending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-label mb-0">Kontakte</h2>
        {canMutate ? (
          <button type="button" className="btn-primary" onClick={openCreate}>
            + Kontakt hinzufügen
          </button>
        ) : null}
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          title="Keine Kontakte"
          description="Für dieses Unternehmen sind noch keine Ansprechpartner hinterlegt."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {ordered.map((contact) => {
            const recommendedHere = contact.id === recommendedContactId;
            return (
              <li
                key={contact.id}
                id={recommendedHere ? "empfohlener-kontakt" : undefined}
                className="surface scroll-mt-24 p-4"
              >
                {recommendedHere ? (
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                    Empfohlener Kontakt
                  </p>
                ) : null}
                <ContactDetails contact={contact} />
                {canMutate ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost" onClick={() => openEdit(contact)}>
                      Bearbeiten
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => {
                      setRemoveError(null);
                      setRemoving(contact);
                    }}>
                      Entfernen
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <ContactForm
        open={formMode !== null}
        title={formMode === "edit" ? "Kontakt bearbeiten" : "Kontakt hinzufügen"}
        submitLabel={formMode === "edit" ? "Speichern" : "Kontakt anlegen"}
        initial={
          editing
            ? {
                firstName: editing.firstName,
                lastName: editing.lastName,
                role: editing.role,
                email: editing.email,
                phone: editing.phone,
                notes: editing.notes,
              }
            : undefined
        }
        pending={pending}
        error={error}
        onClose={() => {
          if (!pending) {
            setFormMode(null);
            setEditing(null);
          }
        }}
        onSubmit={saveContact}
      />

      {removing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Dialog schließen"
            onClick={() => {
              if (!removePending) setRemoving(null);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-remove-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-t-panel border border-line bg-canvas-card shadow-card sm:rounded-panel"
          >
            <div className="border-b border-line px-5 py-4">
              <h3 id="contact-remove-title" className="text-base font-semibold text-ink">
                Kontakt entfernen?
              </h3>
            </div>
            <div className="space-y-3 px-5 py-5">
              <p className="text-sm text-ink-muted">
                {removing.fullName} wird aus diesem Unternehmen entfernt. Bestehende Aktivitäten
                bleiben erhalten.
              </p>
              {removeError ? (
                <p role="alert" className="text-sm text-danger">
                  {removeError}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setRemoving(null)}
                disabled={removePending}
              >
                Abbrechen
              </button>
              <button type="button" className="btn-primary" onClick={confirmRemove} disabled={removePending}>
                {removePending ? "Wird entfernt…" : "Entfernen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
