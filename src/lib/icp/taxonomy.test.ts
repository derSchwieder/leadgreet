import { describe, expect, it } from "vitest";
import { collectIndustryOptions, collectRadarIndustryOptions } from "./options";
import { RADAR_INDUSTRY_TAXONOMY } from "./taxonomy";

describe("radar industry taxonomy", () => {
  it("exposes the V1 industries without touching company values", () => {
    expect(RADAR_INDUSTRY_TAXONOMY.map((item) => item.label)).toEqual([
      "Banken",
      "Versicherungen",
      "Automotive",
      "Industrie",
      "Logistik",
      "Handel",
      "FinTech",
      "Digital Health",
      "Software / IT",
      "Energie",
      "Sonstige",
    ]);
    expect(RADAR_INDUSTRY_TAXONOMY.find((item) => item.label === "Automotive")?.value).toBe(
      "Automobil",
    );
  });

  it("keeps inventory-only collection unchanged", () => {
    const options = collectIndustryOptions([{ industry: "Industrieautomation" }]);
    expect(options.map((item) => item.value)).toEqual(["Industrieautomation"]);
  });

  it("adds taxonomy options next to present company industries", () => {
    const options = collectRadarIndustryOptions([{ industry: "Industrieautomation" }]);
    expect(options.map((item) => item.value)).toContain("Industrieautomation");
    expect(options.map((item) => item.value)).toContain("Automobil");
    expect(options.map((item) => item.value)).toContain("Banken");
  });
});
