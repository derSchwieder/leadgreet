import { describe, expect, it } from "vitest";
import type { DiscoveryViewItem } from "./discovery-presentation";
import {
  availableSignalTypes,
  discoveryErrorMessage,
  discoverySignalCategoryLabel,
  discoverySignalTypeLabel,
  filterDiscoveryItems,
  formatRelativeDetectedAt,
  keepIfStatus,
  matchesDiscoverySearch,
  websiteFromDomain,
} from "./discovery-presentation";

function item(overrides: Partial<DiscoveryViewItem> = {}): DiscoveryViewItem {
  return {
    id: "disc-1",
    title: "Neue KI-Initiative",
    description: "Siemens baut Industrial AI aus.",
    signalType: "AI_AGENT",
    source: "Presse",
    sourceUrl: "https://example.com/siemens",
    detectedAt: "2026-09-25T08:00:00.000Z",
    publishedAt: null,
    companyNameRaw: "Siemens",
    personNameRaw: null,
    domainRaw: "siemens.com",
    status: "NEW",
    confidence: 87,
    resolvedCompany: null,
    resolvedContact: null,
    ...overrides,
  };
}

describe("discovery presentation", () => {
  it("formats relative detection time", () => {
    const now = new Date("2026-09-25T10:00:00.000Z");
    expect(formatRelativeDetectedAt("2026-09-25T08:00:00.000Z", now)).toBe("vor 2 Stunden");
    expect(formatRelativeDetectedAt("2026-09-24T10:00:00.000Z", now)).toBe("vor 1 Tag");
  });

  it("labels signal type and category", () => {
    expect(discoverySignalTypeLabel("AI_AGENT")).toBe("KI-Agent");
    expect(discoverySignalCategoryLabel("AI_AGENT")).toBe("KI");
  });

  it("searches title, company and domain", () => {
    expect(matchesDiscoverySearch(item(), "siemens")).toBe(true);
    expect(matchesDiscoverySearch(item(), "siemens.com")).toBe(true);
    expect(matchesDiscoverySearch(item(), "initiative")).toBe(true);
    expect(matchesDiscoverySearch(item(), "datev")).toBe(false);
  });

  it("filters by query and signal type", () => {
    const items = [item(), item({ id: "disc-2", signalType: "CLOUD_MIGRATION", title: "Cloud" })];
    expect(filterDiscoveryItems(items, "", "AI_AGENT")).toHaveLength(1);
    expect(availableSignalTypes(items)).toEqual(["AI_AGENT", "CLOUD_MIGRATION"]);
  });

  it("removes a resolved item from the NEW list", () => {
    const resolved = item({ status: "RESOLVED", resolvedCompany: { id: "co-1", name: "Siemens" } });
    expect(keepIfStatus([item()], resolved, "NEW")).toEqual([]);
  });

  it("maps API errors without stack traces", () => {
    expect(discoveryErrorMessage(409)).toContain("Status");
    expect(discoveryErrorMessage(404)).toContain("nicht gefunden");
    expect(discoveryErrorMessage(500)).toBe("Die Aktion konnte nicht ausgeführt werden.");
  });

  it("turns a domain into a website URL", () => {
    expect(websiteFromDomain("datev.de")).toBe("https://datev.de");
    expect(websiteFromDomain("https://www.datev.de")).toBe("https://www.datev.de");
    expect(websiteFromDomain("")).toBeNull();
  });
});
