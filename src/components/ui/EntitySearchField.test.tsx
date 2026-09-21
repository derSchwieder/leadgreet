import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EntitySearchField } from "./EntitySearchField";

describe("EntitySearchField", () => {
  it("shows the placeholder and hides the reset button when empty", () => {
    const html = renderToStaticMarkup(
      <EntitySearchField value="" onChange={() => undefined} placeholder="Unternehmen suchen …" />,
    );
    expect(html).toContain("Unternehmen suchen …");
    expect(html).not.toContain("Suche zurücksetzen");
  });

  it("shows a reset control when text is present", () => {
    const html = renderToStaticMarkup(
      <EntitySearchField
        value="Siemens"
        onChange={() => undefined}
        placeholder="Unternehmen suchen …"
      />,
    );
    expect(html).toContain('value="Siemens"');
    expect(html).toContain("Suche zurücksetzen");
  });
});
