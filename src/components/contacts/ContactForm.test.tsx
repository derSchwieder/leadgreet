import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContactForm } from "./ContactForm";

describe("ContactForm", () => {
  it("offers the core contact fields including a persistent note", () => {
    const html = renderToStaticMarkup(
      <ContactForm
        open
        title="Kontakt hinzufügen"
        submitLabel="Kontakt anlegen"
        pending={false}
        error={null}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(html).toContain("Kontakt hinzufügen");
    expect(html).toContain("Vorname");
    expect(html).toContain("Nachname");
    expect(html).toContain("Rolle");
    expect(html).toContain("E-Mail");
    expect(html).toContain("Telefon");
    expect(html).toContain("Kontakt-Notiz");
    expect(html).not.toContain("Aktivität dokumentieren");
  });
});
