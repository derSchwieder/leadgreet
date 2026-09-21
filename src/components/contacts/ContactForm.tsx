"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { CONTACT_ROLE_LABELS } from "@/lib/labels";
import { CONTACT_ROLES } from "@/types";

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint";
const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

export type ContactFormValue = {
  firstName: string;
  lastName: string;
  role: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function ContactForm({
  open,
  title,
  submitLabel,
  initial,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  initial?: Partial<ContactFormValue>;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (value: ContactFormValue) => void;
}) {
  const titleId = useId();
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [role, setRole] = useState(initial?.role ?? "OTHER");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  useEffect(() => {
    if (!open) return;
    setFirstName(initial?.firstName ?? "");
    setLastName(initial?.lastName ?? "");
    setRole(initial?.role ?? "OTHER");
    setEmail(initial?.email ?? "");
    setPhone(initial?.phone ?? "");
    setNotes(initial?.notes ?? "");
  }, [open, initial?.firstName, initial?.lastName, initial?.role, initial?.email, initial?.phone, initial?.notes]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      email: email.trim() || null,
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Formular schließen"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-panel border border-line bg-canvas-card shadow-card sm:rounded-panel"
      >
        <form onSubmit={handleSubmit}>
          <div className="border-b border-line px-5 py-4">
            <h3 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h3>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`${titleId}-first`}>
                  Vorname
                </label>
                <input
                  id={`${titleId}-first`}
                  className={fieldClass}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  maxLength={80}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${titleId}-last`}>
                  Nachname
                </label>
                <input
                  id={`${titleId}-last`}
                  className={fieldClass}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  maxLength={80}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor={`${titleId}-role`}>
                Rolle
              </label>
              <select
                id={`${titleId}-role`}
                className={fieldClass}
                value={role}
                onChange={(event) => setRole(event.target.value)}
                required
              >
                {CONTACT_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {CONTACT_ROLE_LABELS[value] ?? value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor={`${titleId}-email`}>
                E-Mail
              </label>
              <input
                id={`${titleId}-email`}
                type="email"
                className={fieldClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={200}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`${titleId}-phone`}>
                Telefon
              </label>
              <input
                id={`${titleId}-phone`}
                className={fieldClass}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={60}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`${titleId}-notes`}>
                Kontakt-Notiz
              </label>
              <textarea
                id={`${titleId}-notes`}
                className={`${fieldClass} min-h-[88px] resize-y`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={4000}
                placeholder="Dauerhafte Information über die Person"
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={pending}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Wird gespeichert…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
