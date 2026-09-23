import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RadarDashboard } from "./RadarDashboard";
import { RadarView } from "./RadarView";
import { EMPTY_ACCOUNT_ICP, type IcpCompanyRecord } from "@/lib/icp";
import type { RadarPoint } from "@/lib/radar";

const points: RadarPoint[] = [
  {
    companyId: "harting",
    name: "HARTING Technology Group",
    city: "Espelkamp",
    country: "Deutschland",
    latitude: 52.3775,
    longitude: 8.6231,
    greet: 70,
    signalTitle: "RISE with SAP",
    website: null,
  },
  {
    companyId: "tv",
    name: "TeamViewer SE",
    city: "Göppingen",
    country: "Deutschland",
    latitude: 48.7054,
    longitude: 9.6511,
    greet: 75,
    signalTitle: "TeamViewer Intelligence",
    website: null,
  },
];

const companies: IcpCompanyRecord[] = [
  { id: "harting", industry: "Industrieautomation", country: "Deutschland" },
  { id: "tv", industry: "Software", country: "Deutschland" },
  { id: "swiss", industry: "Software", country: "Schweiz" },
  { id: "blank", industry: null, country: "Deutschland" },
];

describe("RadarDashboard", () => {
  const html = renderToStaticMarkup(
    <RadarDashboard points={points} companies={companies} initialIcp={EMPTY_ACCOUNT_ICP} />,
  );

  it("renders the dashboard hero and start control", () => {
    expect(html).toContain("Radar");
    expect(html).toContain("Dein Markt");
    expect(html).toContain("im Blick.");
    expect(html).toContain("RADAR STARTEN");
    expect(html).toContain("Aktiviere den Radar");
  });

  it("renders the ICP filters from company data", () => {
    expect(html).toContain("Mein ICP");
    expect(html).toContain("Branche");
    expect(html).toContain("Land");
    expect(html).toContain("Alle Branchen");
    expect(html).toContain("Alle Länder");
    expect(html).toContain("Industrieautomation");
    expect(html).toContain("Software");
    expect(html).toContain("Deutschland");
    expect(html).toContain("Schweiz");
    expect(html).not.toContain("Automotive");
    expect(html).not.toContain("Österreich");
  });

  it("shows known, ICP-matching and on-radar counts from real data", () => {
    expect(html).toContain("Bekannte Unternehmen");
    expect(html).toContain("ICP-passend");
    expect(html).toContain("Auf dem Radar");
    expect(html).toContain(">4<");
    expect(html).toContain(">2<");
    expect(html).not.toContain("Verfügbarer Unternehmensbestand");
  });

  it("exposes employee and revenue minima as real fields", () => {
    expect(html).toContain("Mitarbeiter");
    expect(html).toContain("Umsatz");
    expect(html).toContain("mindestens");
    expect(html).toContain("Mio. €");
    expect(html).toContain('name="icp-employees"');
    expect(html).toContain('name="icp-revenue"');
    expect(html).toContain("ICP SPEICHERN");
    expect(html).not.toContain("Demnächst verfügbar");
    expect(html.match(/type="range"/g)?.length).toBe(1);
  });

  it("hydrates a stored ICP after reload", () => {
    const stored = renderToStaticMarkup(
      <RadarDashboard
        points={points}
        companies={companies}
        initialIcp={{
          industries: ["Software"],
          countries: ["Deutschland"],
          minEmployees: 100,
          minRevenue: 50_000_000,
        }}
      />,
    );
    expect(stored).toContain('value="Software"');
    expect(stored).toContain("checked");
    expect(stored).toContain('value="100"');
    expect(stored).toContain('value="50"');
  });

  it("does not invent radar-run history", () => {
    expect(html).not.toContain("letzter Lauf");
    expect(html).not.toContain("Letzte Radar-Läufe");
  });

  it("keeps search and the Greet slider in the dashboard", () => {
    expect(html).toContain("Unternehmen suchen …");
    expect(html).toContain('id="radar-company-search"');
    expect(html).toContain('id="radar-sensitivity"');
    expect(html).toContain("GREET 0");
    expect(html).toContain("alle passenden Unternehmen");
    expect(html).toContain("ab Greet 50");
    expect(html).toContain("nur passende Unternehmen mit Greet ≥ 75");
    expect(html).toContain("nur passende Unternehmen mit Greet = 100");
  });

  it("does not replace Company-Greet with a Chance score", () => {
    expect(html).not.toContain("Chance-Score");
    expect(html).toContain("Greet");
  });
});

describe("RadarView", () => {
  it("keeps the existing map list, search and Greet slider reachable", () => {
    const html = renderToStaticMarkup(<RadarView points={points} />);
    expect(html).toContain("Unternehmen suchen …");
    expect(html).toContain('id="radar-sensitivity"');
    expect(html).toContain("Im Radar");
    expect(html).toContain("HARTING Technology Group");
    expect(html).toContain("TeamViewer SE");
    expect(html).toContain("Greet");
    expect(html).toContain("70");
    expect(html).toContain("75");
    expect(html).not.toContain("Chance");
    expect(html).toContain("Karte wird geladen");
  });

  it("still filters through the existing Greet slider when controls are hidden", () => {
    const html = renderToStaticMarkup(
      <RadarView points={points} threshold={72} query="" hideControls />,
    );
    expect(html).toContain("TeamViewer SE");
    expect(html).not.toContain("HARTING Technology Group");
    expect(html).not.toContain("radar-company-search");
  });
});
