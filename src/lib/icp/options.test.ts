import { describe, expect, it } from "vitest";
import { collectCountryOptions, collectIndustryOptions } from "./options";

describe("ICP filter options from company data", () => {
  it("builds industry options only from present company values", () => {
    const options = collectIndustryOptions([
      { industry: "Software" },
      { industry: "Industrieautomation" },
      { industry: null },
      { industry: "  " },
      { industry: "software" },
    ]);

    expect(options.map((option) => option.label)).toEqual([
      "Industrieautomation",
      "Software",
    ]);
    expect(options.map((option) => option.label)).not.toContain("Automotive");
    expect(options.map((option) => option.label)).not.toContain("Maschinenbau");
  });

  it("collapses known industry spellings without inventing a new branch", () => {
    const options = collectIndustryOptions([
      { industry: "Industrial" },
      { industry: "Industrie" },
    ]);
    expect(options).toHaveLength(1);
    expect(options[0]?.label).toBe("Industrie");
  });

  it("builds country options only from present company values", () => {
    const options = collectCountryOptions([
      { country: "DE" },
      { country: "Schweiz" },
      { country: null },
      { country: "Deutschland" },
      { country: "  " },
    ]);

    expect(options.map((option) => option.label)).toEqual(["Deutschland", "Schweiz"]);
    expect(options.map((option) => option.label)).not.toContain("Österreich");
  });
});
