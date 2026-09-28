import { describe, expect, it } from "vitest";
import { researchExistingSignals, toScreeningSignals } from "./existing-signal-researcher";
import type { LocalCatalogSignal } from "./types";

const now = new Date("2026-09-25T10:00:00.000Z");

const recent: LocalCatalogSignal = {
  id: "sig-ai",
  type: "HIRING",
  title: "AI Platform Engineer",
  description: "Stelle für den Aufbau eines AI-Teams.",
  detectedAt: new Date("2026-08-01T00:00:00.000Z"),
  sourceName: "Karriere DATEV",
  sourceUrl: "https://www.datev.de/jobs/ai",
};

const lastYear: LocalCatalogSignal = {
  id: "sig-cloud",
  type: "PRODUCT",
  title: "Cloud-Initiative",
  description: null,
  detectedAt: new Date("2026-01-15T00:00:00.000Z"),
  sourceName: "Presse",
  sourceUrl: "https://www.datev.de/presse/cloud",
};

const tooOld: LocalCatalogSignal = {
  id: "sig-old",
  type: "OTHER",
  title: "Alte Meldung",
  description: null,
  detectedAt: new Date("2024-01-01T00:00:00.000Z"),
  sourceName: "Archiv",
  sourceUrl: "https://example.com/old",
};

describe("existing signal research", () => {
  it("keeps signals from the last year and prefers the last 90 days", () => {
    const mapped = toScreeningSignals([recent, lastYear, tooOld], now);
    expect(mapped.map((signal) => signal.signalId)).toEqual(["sig-ai", "sig-cloud"]);
    expect(mapped[0]).toMatchObject({
      kind: "SIGNAL",
      relevance: 80,
      source: "Karriere DATEV",
      sourceUrl: "https://www.datev.de/jobs/ai",
      date: "2026-08-01T00:00:00.000Z",
    });
    expect(mapped[1]?.relevance).toBe(50);
  });

  it("does not invent signals when no company is known", async () => {
    const finding = await researchExistingSignals(async () => [recent], null, now);
    expect(finding).toEqual({ signals: [], sources: [] });
  });

  it("stores a source for each catalog signal", async () => {
    const finding = await researchExistingSignals(async () => [recent], "co-datev", now);
    expect(finding.sources).toEqual([
      {
        title: "AI Platform Engineer",
        url: "https://www.datev.de/jobs/ai",
        publisher: "Karriere DATEV",
        publishedAt: "2026-08-01T00:00:00.000Z",
      },
    ]);
  });
});
