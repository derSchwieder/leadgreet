import { DemoBanner } from "@/components/layout/DemoBanner";
import { CompanyName } from "@/components/ui/CompanyName";
import { DemoBadge } from "@/components/ui/DemoBadge";
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
        eyebrow="Personen"
        title="Kontakte"
        description="Identifizierte Stakeholder. Demo-Kontakte sind Platzhalter, keine realen Mitarbeitenden."
      />
      <DemoBanner seedCount={seedCount} />
      {contacts.length === 0 ? (
        <EmptyState
          title="Noch keine Kontakte"
          description="Identifizierte Ansprechpartner erscheinen hier, sobald sie erfasst sind."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unternehmen</th>
                <th>Rolle</th>
                <th>Entscheider</th>
                <th>Sicherheit</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="text-ink">
                    <span className="inline-flex items-center gap-2">
                      {contact.fullName}
                      {contact.isSeed ? <DemoBadge /> : null}
                    </span>
                  </td>
                  <td>
                    <CompanyName
                      id={contact.company.id}
                      name={contact.company.name}
                      size="xs"
                      muted
                    />
                  </td>
                  <td className="text-ink-muted">{formatEnum(contact.role)}</td>
                  <td className="text-ink-muted">{contact.isDecisionMaker ? "Ja" : "Nein"}</td>
                  <td className="font-mono tabular text-ink-muted">{contact.confidenceScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
