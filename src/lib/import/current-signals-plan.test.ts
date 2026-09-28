import { describe, expect, it } from "vitest";
import { CURRENT_SIGNALS_2026 } from "../../../scripts/data/current-signals-2026";
import {
  findExistingCompany,
  findExistingSignal,
  normalizeSourceUrl,
  planCurrentSignals,
} from "./current-signals-plan";

const companies = [
  { id: "tv", name: "TeamViewer SE", website: "https://www.teamviewer.com", isSeed: false },
  { id: "siemens", name: "Siemens AG", website: "https://www.siemens.com", isSeed: false },
  { id: "bmw", name: "BMW AG", website: "https://www.bmwgroup.com", isSeed: false },
];

describe("Current Signals 2026 dataset", () => {
  it("contains five independent official signals", () => {
    expect(CURRENT_SIGNALS_2026).toHaveLength(5);
    const urls = CURRENT_SIGNALS_2026.map((item) => normalizeSourceUrl(item.source.url));
    expect(new Set(urls).size).toBe(5);
    expect(CURRENT_SIGNALS_2026.every((item) => item.company.isSeed === false)).toBe(true);
  });

  it("keeps two TeamViewer signals as separate records", () => {
    const teamviewer = CURRENT_SIGNALS_2026.filter((item) => item.company.name === "TeamViewer SE");
    expect(teamviewer).toHaveLength(2);
    expect(teamviewer[0]?.source.url).not.toBe(teamviewer[1]?.source.url);
    expect(teamviewer[0]?.date).toBe("2026-09-08");
    expect(teamviewer[1]?.date).toBe("2026-09-15");
  });
});

describe("Company reuse", () => {
  it("finds an existing company by website and does not treat it as new", () => {
    const record = CURRENT_SIGNALS_2026[0];
    expect(record).toBeDefined();
    if (!record) return;
    const existing = findExistingCompany(record, companies);
    expect(existing?.id).toBe("tv");
    const { plans } = planCurrentSignals([record], companies, [], []);
    expect(plans[0]?.companyDecision).toBe("gefunden");
    expect(plans[0]?.signalDecision).toBe("neu");
  });

  it("plans HARTING as a new company when it is missing", () => {
    const harting = CURRENT_SIGNALS_2026.find((item) => item.company.name.startsWith("HARTING"));
    expect(harting).toBeDefined();
    if (!harting) return;
    const { plans } = planCurrentSignals([harting], companies, [], []);
    expect(plans[0]?.companyDecision).toBe("neu");
    expect(plans[0]?.signalDecision).toBe("neu");
  });

  it("counts a second TeamViewer row as the same found company, not a duplicate company", () => {
    const teamviewer = CURRENT_SIGNALS_2026.filter((item) => item.company.name === "TeamViewer SE");
    const { plans } = planCurrentSignals(teamviewer, companies, [], []);
    expect(plans.map((plan) => plan.companyDecision)).toEqual(["gefunden", "gefunden"]);
    expect(plans.every((plan) => plan.signalDecision === "neu")).toBe(true);
  });
});

describe("Signal deduplication", () => {
  it("dedupes only by companyId + sourceUrl, not by title or date", () => {
    const record = CURRENT_SIGNALS_2026[0];
    expect(record).toBeDefined();
    if (!record) return;
    const match = findExistingSignal("tv", record.source.url, [
      { id: "sig-1", companyId: "tv", sourceUrl: record.source.url },
    ]);
    expect(match?.id).toBe("sig-1");
    const otherUrl = findExistingSignal("tv", record.source.url, [
      { id: "sig-old", companyId: "tv", sourceUrl: "https://www.teamviewer.com/other" },
    ]);
    expect(otherUrl).toBeUndefined();
  });

  it("marks a signal as existing when the same URL is already stored for that company", () => {
    const record = CURRENT_SIGNALS_2026[2];
    expect(record).toBeDefined();
    if (!record) return;
    const { plans } = planCurrentSignals(
      [record],
      companies,
      [{ id: "existing-siemens", companyId: "siemens", sourceUrl: record.source.url }],
      [{ id: "src", url: record.source.url }],
    );
    expect(plans[0]?.companyDecision).toBe("gefunden");
    expect(plans[0]?.signalDecision).toBe("existing");
    expect(plans[0]?.sourceDecision).toBe("existing");
  });

  it("does not skip a seed-unrelated second TeamViewer URL", () => {
    const teamviewer = CURRENT_SIGNALS_2026.filter((item) => item.company.name === "TeamViewer SE");
    const firstUrl = teamviewer[0]?.source.url;
    expect(firstUrl).toBeDefined();
    if (!firstUrl) return;
    const { plans } = planCurrentSignals(
      teamviewer,
      companies,
      [{ id: "old", companyId: "tv", sourceUrl: firstUrl }],
      [],
    );
    expect(plans[0]?.signalDecision).toBe("existing");
    expect(plans[1]?.signalDecision).toBe("neu");
  });
});

describe("Seed protection", () => {
  it("does not attach current signals to a seed company", () => {
    const record = CURRENT_SIGNALS_2026[0];
    expect(record).toBeDefined();
    if (!record) return;
    const { plans } = planCurrentSignals(
      [record],
      [{ id: "seed-tv", name: "TeamViewer SE", website: "https://www.teamviewer.com", isSeed: true }],
      [],
      [],
    );
    expect(plans[0]?.companyDecision).toBe("skip-seed");
    expect(plans[0]?.signalDecision).toBe("skip");
  });
});
