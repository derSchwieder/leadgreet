import Link from "next/link";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupState } from "@/components/ui/SetupState";
import { getDatabaseGate } from "@/lib/db/status";
import { listContacts } from "@/lib/db/contacts";
import { formatEnum } from "@/lib/format";

export default async function ContactsPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const contacts = await listContacts();
  const seedCount = contacts.filter((contact) => contact.isSeed).length;

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Contacts"
        description="Identified stakeholders. Seed contacts are placeholders, not real employees."
      />
      <DemoBanner seedCount={seedCount} />
      {contacts.length === 0 ? (
        <EmptyState title="No contacts" description="Create a contact via POST /api/contacts." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-canvas-elevated text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Decision maker</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-line hover:bg-canvas-hover">
                  <td className="px-4 py-3 text-ink">
                    {contact.fullName}
                    {contact.isSeed ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-faint">
                        demo
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/companies/${contact.company.id}`} className="text-ink-muted hover:text-accent">
                      {contact.company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatEnum(contact.role)}</td>
                  <td className="px-4 py-3 text-ink-muted">{contact.isDecisionMaker ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 font-mono tabular text-ink-muted">
                    {contact.confidenceScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
