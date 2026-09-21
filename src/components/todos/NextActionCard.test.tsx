import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NextActionCard } from "./NextActionCard";
import { buildNextAction } from "@/lib/todos/next-action";

describe("NextActionCard", () => {
  it("renders the CONTACT_EXISTING suggestion with contact and channel", () => {
    const suggestion = buildNextAction({
      nextStep: "CONTACT_EXISTING",
      contact: {
        id: "c-cdo",
        fullName: "Seed CDO",
        role: "CDO",
        email: "cdo@example.com",
        phone: null,
      },
      allowedContactIds: ["c-cdo"],
    });

    const html = renderToStaticMarkup(
      <NextActionCard
        suggestion={suggestion}
        canMutate
        onAccept={() => undefined}
        onOwnTodo={() => undefined}
      />,
    );

    expect(html).toContain("Das sollte als Nächstes passieren");
    expect(html).toContain("Passenden Ansprechpartner kontaktieren");
    expect(html).toContain("Seed CDO · CDO");
    expect(html).toContain("Empfohlener Kontaktweg");
    expect(html).toContain("Telefon + E-Mail");
    expect(html).toContain("Telefonnummer ist aktuell nicht hinterlegt");
    expect(html).toContain("Telefonnummer recherchieren");
    expect(html).toContain("Vorschlag übernehmen");
    expect(html).toContain("Eigenes To-do");
  });

  it("falls back to a custom todo when intelligence has no next step", () => {
    const html = renderToStaticMarkup(
      <NextActionCard
        suggestion={null}
        canMutate
        onAccept={() => undefined}
        onOwnTodo={() => undefined}
      />,
    );

    expect(html).toContain("Kein konkreter nächster Schritt vorgeschlagen.");
    expect(html).toContain("Eigenes To-do");
    expect(html).not.toContain("Vorschlag übernehmen");
  });
});
