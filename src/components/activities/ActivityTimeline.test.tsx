import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActivityTimeline } from "./ActivityTimeline";
import type { TimelineActivity } from "./types";

function activity(overrides: Partial<TimelineActivity>): TimelineActivity {
  return {
    id: "act-1",
    type: "EMAIL_SENT",
    subject: null,
    note: "Passenden Inhalt senden",
    occurredAt: "2026-09-18T14:00:00.000Z",
    outcome: null,
    contactId: null,
    contactName: null,
    responseToActivityId: null,
    ...overrides,
  };
}

describe("ActivityTimeline", () => {
  it("shows the newest activity first with German label, date and description", () => {
    const html = renderToStaticMarkup(
      <ActivityTimeline
        opportunityId="opp-1"
        companyId="co-1"
        canMutate={false}
        activities={[
          activity({
            id: "older",
            type: "NOTE",
            note: "Ältere Notiz",
            occurredAt: "2026-09-01T08:00:00.000Z",
          }),
          activity({
            id: "newer",
            type: "EMAIL_SENT",
            note: "Passenden Inhalt senden",
            occurredAt: "2026-09-18T12:00:00.000Z",
          }),
        ]}
        statusHistory={[]}
        contacts={[]}
      />,
    );

    expect(html).toContain("E-Mail gesendet");
    expect(html).toContain("Passenden Inhalt senden");
    expect(html).toContain("18.09.2026");
    expect(html.indexOf("E-Mail gesendet")).toBeLessThan(html.indexOf("Notiz"));
    expect(html.indexOf("Passenden Inhalt senden")).toBeLessThan(html.indexOf("Ältere Notiz"));
    expect(html).toContain("Details anzeigen");
  });

  it("keeps status changes visible in the compact timeline", () => {
    const html = renderToStaticMarkup(
      <ActivityTimeline
        opportunityId="opp-1"
        companyId="co-1"
        canMutate={false}
        activities={[
          activity({
            id: "act-call",
            type: "CALL",
            subject: "Anruf mit CDO",
            note: "Längere interne Notiz zum Gesprächsversuch.",
            occurredAt: "2026-09-29T10:00:00.000Z",
            contactName: "Seed CDO",
            contactRole: "CDO",
            outcome: "NOT_REACHABLE",
          }),
        ]}
        statusHistory={[
          {
            id: "st-1",
            fromStatus: "CONTACTED",
            toStatus: "MEETING",
            note: "Termin über Assistenz bestätigt",
            changedAt: "2026-09-28T09:00:00.000Z",
          },
        ]}
        contacts={[{ id: "c-1", fullName: "Seed CDO", role: "CDO" }]}
      />,
    );

    expect(html).toContain("29.09.2026");
    expect(html).toContain("Anruf");
    expect(html).toContain("Anruf mit CDO");
    expect(html).toContain("Seed CDO · CDO");
    expect(html).toContain("Nicht erreicht");
    expect(html).toContain("Statusänderung");
    expect(html).toContain("Kontaktiert");
    expect(html).toContain("Termin vereinbart");
    expect(html).toContain("Details anzeigen");
  });

  it("can render only the document action without the timeline", () => {
    const html = renderToStaticMarkup(
      <ActivityTimeline
        opportunityId="opp-1"
        companyId="co-1"
        canMutate
        actionsOnly
        activities={[]}
        statusHistory={[]}
        contacts={[]}
      />,
    );

    expect(html).toContain("+ Aktivität dokumentieren");
    expect(html).not.toContain("Verlauf");
  });
});
