import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SignalSourceLine } from "./SignalSourceLine";

describe("SignalSourceLine", () => {
  it("renders a clickable original-source link from the stored URL", () => {
    const html = renderToStaticMarkup(
      <SignalSourceLine
        sourceName="TeamViewer Presse"
        sourceUrl="https://www.teamviewer.com/en/insights/teamviewer-ai-adoption-grows-ninefold-in-twelve-months/"
      />,
    );

    expect(html).toContain("Quelle: TeamViewer Presse");
    expect(html).toContain("Quelle öffnen ↗");
    expect(html).toContain(
      'href="https://www.teamviewer.com/en/insights/teamviewer-ai-adoption-grows-ninefold-in-twelve-months/"',
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("https://www.teamviewer.com/en/insights/teamviewer-ai-adoption-grows-ninefold-in-twelve-months/</a>");
  });

  it("does not render a broken link when no valid sourceUrl is stored", () => {
    const missing = renderToStaticMarkup(
      <SignalSourceLine sourceName="TeamViewer Presse" sourceUrl={null} />,
    );
    const invalid = renderToStaticMarkup(
      <SignalSourceLine sourceName="TeamViewer Presse" sourceUrl="not-a-url" />,
    );
    const empty = renderToStaticMarkup(<SignalSourceLine sourceName={null} sourceUrl={null} />);

    expect(missing).toContain("Quelle: TeamViewer Presse");
    expect(missing).not.toContain("Quelle öffnen");
    expect(missing).not.toContain("href=");
    expect(invalid).not.toContain("Quelle öffnen");
    expect(invalid).not.toContain('href="not-a-url"');
    expect(empty).toBe("");
  });
});
