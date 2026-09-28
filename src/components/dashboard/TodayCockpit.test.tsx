import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TodayCockpit } from "./TodayCockpit";
import type { TodayCockpitView } from "@/lib/dashboard/today-view";

const heroView: TodayCockpitView = {
  hero: {
    companyId: "tv",
    companyName: "TeamViewer SE",
    opportunityId: "opp-tv",
    kind: "signal",
    headline: "Heute zuerst: TeamViewer SE kontaktieren",
    greet: 75,
    occasion: "Neues KI-Signal: Tia Troubleshooting",
    reason: "Ein passender Ansprechpartner ist bereits vorhanden.",
    nextStep: "CONTACT_EXISTING",
    nextActionTitle: "Passenden Ansprechpartner kontaktieren",
    channelLabel: "E-Mail",
    todoId: null,
    todoTitle: null,
    todoDue: null,
    contactName: "Seed CDO",
  },
  more: [
    {
      companyId: "harting",
      companyName: "HARTING Technology Group",
      opportunityId: "opp-harting",
      kind: "follow_up",
      headline: "HARTING Technology Group nachfassen",
      greet: 70,
      occasion: "Follow-up nach letzter Aktivität",
      reason: "Es gibt bereits eine dokumentierte Ansprache ohne klaren Abschluss.",
      nextStep: "CHECK_FOLLOW_UP",
      nextActionTitle: "Follow-up durchführen",
      channelLabel: null,
      todoId: null,
      todoTitle: null,
      todoDue: null,
      contactName: "Seed Transformation",
    },
    {
      companyId: "climaline",
      companyName: "Climaline",
      opportunityId: "opp-clima",
      kind: "signal",
      headline: "Climaline kontaktieren",
      greet: 72,
      occasion: "Neues KI-Signal: Digitaler Zwilling",
      reason: null,
      nextStep: "PREPARE_OUTREACH",
      nextActionTitle: "Kontaktaufnahme vorbereiten",
      channelLabel: null,
      todoId: null,
      todoTitle: null,
      todoDue: null,
      contactName: "Seed Innovation",
    },
  ],
  nextActions: {},
};

describe("TodayCockpit", () => {
  it("renders a featured hero and compact rows for other companies", () => {
    const html = renderToStaticMarkup(<TodayCockpit today={heroView} />);
    expect(html).toContain("Heute zuerst");
    expect(html).toContain("TeamViewer SE");
    expect(html).toContain("Neues KI-Signal: Tia Troubleshooting");
    expect(html).toContain("Greet");
    expect(html).toContain("75");
    expect(html).toContain("Passenden Ansprechpartner kontaktieren");
    expect(html).toContain("HARTING Technology Group");
    expect(html).toContain("Follow-up");
    expect(html).toContain("Kontaktieren");
    expect(html).toContain("Climaline");
    expect(html).toContain("Neues Signal");
    expect(html).toContain("Öffnen");
    expect(html).not.toContain("Chance-Score");
    expect(html.indexOf("surface-featured")).toBeLessThan(html.indexOf("list-shell"));
    expect(html.match(/surface-featured/g)?.length).toBe(1);
  });

  it("labels a due-today todo hero without inventing a new action type", () => {
    const html = renderToStaticMarkup(
      <TodayCockpit
        today={{
          hero: {
            ...heroView.hero!,
            kind: "todo",
            headline: "Heute Anna Meier passenden Content senden",
            occasion: "Anna Meier passenden Content senden",
            nextActionTitle: "Passenden Content senden",
            todoDue: "today",
            contactName: "Anna Meier",
          },
          more: [],
          nextActions: {},
        }}
      />,
    );
    expect(html).toContain("Todo heute fällig");
    expect(html).toContain("Anna Meier passenden Content senden");
    expect(html).toContain("Passenden Content senden");
  });

  it("renders the empty state with a radar CTA", () => {
    const html = renderToStaticMarkup(<TodayCockpit today={{ hero: null, more: [], nextActions: {} }} />);
    expect(html).toContain("Heute steht nichts Dringendes an.");
    expect(html).toContain("Schau ins Radar, um neue Chancen zu entdecken.");
    expect(html).toContain("Radar öffnen");
    expect(html).toContain("/radar");
  });
});
