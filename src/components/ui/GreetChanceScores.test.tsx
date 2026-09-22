import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GreetChanceScores, toOpportunityHeaderScores } from "./GreetChanceScores";

describe("toOpportunityHeaderScores", () => {
  it("keeps TeamViewer Company-Greet 75 and Opportunity-Score 57 as separate values", () => {
    expect(
      toOpportunityHeaderScores({
        companyGreetScore: 75,
        opportunityScore: 57,
      }),
    ).toEqual({ greet: 75, chance: 57 });
  });

  it("never uses the Opportunity-Score as GREET when Company-Greet is missing", () => {
    expect(
      toOpportunityHeaderScores({
        companyGreetScore: null,
        opportunityScore: 57,
      }),
    ).toEqual({ greet: null, chance: 57 });
  });
});

describe("GreetChanceScores", () => {
  it("shows Company-Greet and Chance as separate values that may differ", () => {
    const html = renderToStaticMarkup(<GreetChanceScores greet={75} chance={57} />);
    const greetStart = html.indexOf('data-score-kind="greet"');
    const chanceStart = html.indexOf('data-score-kind="chance"');
    const greetHtml = html.slice(greetStart, chanceStart);
    const chanceHtml = html.slice(chanceStart);

    expect(greetHtml).toContain("Greet");
    expect(greetHtml).toContain("75");
    expect(greetHtml).toContain("aktuelle Vertriebsrelevanz");
    expect(greetHtml).not.toContain("57");
    expect(chanceHtml).toContain("Chance");
    expect(chanceHtml).toContain("57");
    expect(chanceHtml).toContain("dieser konkrete Vertriebsanlass");
    expect(chanceHtml).not.toContain("75");
    expect(html).not.toContain("+18");
  });

  it("shows Company-Greet without a Chance when no opportunity exists", () => {
    const html = renderToStaticMarkup(<GreetChanceScores greet={70} />);
    expect(html).toContain("Greet");
    expect(html).toContain("70");
    expect(html).toContain("aktuelle Vertriebsrelevanz");
    expect(html).not.toContain("dieser konkrete Vertriebsanlass");
    expect(html).not.toContain("Chance");
  });

  it("shows Chance alone when Company-Greet is missing", () => {
    const html = renderToStaticMarkup(<GreetChanceScores chance={57} />);
    expect(html).toContain("Chance");
    expect(html).toContain("57");
    expect(html).toContain("dieser konkrete Vertriebsanlass");
    expect(html).not.toContain("aktuelle Vertriebsrelevanz");
    expect(html).not.toContain("Greet");
  });
});
