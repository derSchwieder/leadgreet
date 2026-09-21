import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OpportunityActivities } from "./OpportunityActivities";

describe("OpportunityActivities", () => {
  it("renders timeline and open todos in a two-column work layout", () => {
    const html = renderToStaticMarkup(
      <OpportunityActivities
        opportunityId="opp-1"
        companyId="co-1"
        canMutate
        todos={[
          {
            id: "todo-1",
            title: "CIO Herrn Meier kontaktieren",
            dueAt: "2026-10-02T09:30:00.000Z",
            status: "OPEN",
            completedAt: null,
            contactId: "c-1",
            contactName: "Herr Meier",
            contactRole: "CIO",
            relatedActivityId: null,
          },
          {
            id: "todo-2",
            title: "Erledigtes Follow-up",
            dueAt: "2026-09-01T00:00:00.000Z",
            status: "DONE",
            completedAt: "2026-09-18T10:00:00.000Z",
            contactId: null,
            contactName: null,
            contactRole: null,
            relatedActivityId: null,
          },
        ]}
        activities={[
          {
            id: "newer",
            type: "CALL",
            subject: "Anruf mit CDO",
            note: "Längere interne Notiz.",
            occurredAt: "2026-09-29T10:00:00.000Z",
            outcome: "NOT_REACHABLE",
            contactId: "c-cdo",
            contactName: "Seed CDO",
            contactRole: "CDO",
            responseToActivityId: null,
          },
          {
            id: "older",
            type: "NOTE",
            subject: "Ältere Notiz",
            note: null,
            occurredAt: "2026-09-01T08:00:00.000Z",
            outcome: null,
            contactId: null,
            contactName: null,
            contactRole: null,
            responseToActivityId: null,
          },
        ]}
        statusHistory={[
          {
            id: "st-1",
            fromStatus: "CONTACTED",
            toStatus: "MEETING",
            note: "Termin bestätigt",
            changedAt: "2026-09-28T09:00:00.000Z",
          },
        ]}
        contacts={[
          { id: "c-cdo", fullName: "Seed CDO", role: "CDO" },
          { id: "c-1", fullName: "Herr Meier", role: "CIO" },
        ]}
      />,
    );

    expect(html).toContain("lg:grid-cols-[minmax(0,7fr)_minmax(16rem,3fr)]");
    expect(html).toContain("order-1");
    expect(html).toContain("lg:order-2");
    expect(html).toContain("Verlauf");
    expect(html).toContain("+ Aktivität dokumentieren");
    expect(html).toContain("To-dos");
    expect(html).toContain("Eigenes To-do");
    expect(html).toContain("CIO Herrn Meier kontaktieren");
    expect(html).toContain("Erledigen");
    expect(html).toContain("Erledigtes Follow-up");
    expect(html).toContain("Anruf mit CDO");
    expect(html).toContain("Seed CDO · CDO");
    expect(html).toContain("Statusänderung");
    expect(html).toContain("Details anzeigen");
    expect(html.indexOf("Anruf mit CDO")).toBeLessThan(html.indexOf("Ältere Notiz"));
  });
});
