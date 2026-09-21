import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TodoPanel } from "./TodoPanel";

describe("TodoPanel", () => {
  it("shows an open todo with contact and complete action", () => {
    const html = renderToStaticMarkup(
      <TodoPanel
        opportunityId="opp-1"
        companyId="co-1"
        canMutate
        todos={[
          {
            id: "todo-1",
            title: "CIO Herrn Meier kontaktieren",
            dueAt: "2026-10-02T00:00:00.000Z",
            status: "OPEN",
            completedAt: null,
            contactId: "c-1",
            contactName: "Herr Meier",
            contactRole: "CIO",
            relatedActivityId: null,
          },
        ]}
        contacts={[{ id: "c-1", fullName: "Herr Meier", role: "CIO" }]}
        activities={[]}
      />,
    );

    expect(html).toContain("02.10.2026");
    expect(html).toContain("CIO Herrn Meier kontaktieren");
    expect(html).toContain("Herr Meier · CIO");
    expect(html).toContain("Erledigen");
    expect(html).toContain("Eigenes To-do");
  });

  it("shows the next-step suggestion and keeps a custom todo action", () => {
    const html = renderToStaticMarkup(
      <TodoPanel
        opportunityId="opp-1"
        companyId="co-1"
        canMutate
        nextStep="CONTACT_EXISTING"
        nextActionContact={{
          id: "c-cdo",
          fullName: "Seed CDO",
          role: "CDO",
          email: "cdo@example.com",
          phone: null,
        }}
        todos={[]}
        contacts={[{ id: "c-cdo", fullName: "Seed CDO", role: "CDO" }]}
        activities={[]}
      />,
    );

    expect(html).toContain("Passenden Ansprechpartner kontaktieren");
    expect(html).toContain("Seed CDO · CDO");
    expect(html).toContain("Empfohlener Kontaktweg");
    expect(html).toContain("Vorschlag übernehmen");
    expect(html).toContain("Eigenes To-do");
    expect(html).toContain("Offene To-dos");
  });
});
