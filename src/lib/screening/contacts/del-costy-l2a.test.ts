import { describe, expect, it } from "vitest";
import { SIEMENS_EXTRACTION_AUDIT_FIXTURES } from "../../../../scripts/data/siemens-extraction-audit-fixtures";
import {
  extractContactCandidates,
  extractPeopleFromText,
  EXTRACTION_PATTERN_L2A_SIEMENS_LEADERSHIP,
} from "./extract";
import { deriveContactThemes } from "./themes";

function researchText(fixture: { title: string; description: string }): string {
  return `${fixture.title}\n${fixture.description}`;
}

function siemensScope(url: string) {
  return { company: "Siemens", sourceUrl: url };
}

describe("L2-a Siemens leadership (Del Costy)", () => {
  const themes = deriveContactThemes([], [
    "Digitale Transformation",
    "IT & Digitalization",
    "KI / AI",
  ]);

  it("extracts Del Costy from us-management-list fixture (Stage A)", () => {
    const fixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
      (f) => f.id === "del-costy-us-management-list",
    )!;
    const people = extractPeopleFromText(researchText(fixture), siemensScope(fixture.provenance.url));
    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({
      name: "Del Costy",
      role: "President and Managing Director",
      pattern: EXTRACTION_PATTERN_L2A_SIEMENS_LEADERSHIP,
    });
  });

  it("extracts Del Costy from profile-serp fixture (Stage A)", () => {
    const fixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
      (f) => f.id === "del-costy-profile-serp",
    )!;
    const people = extractPeopleFromText(researchText(fixture), siemensScope(fixture.provenance.url));
    expect(people.some((p) => p.name === "Del Costy")).toBe(true);
    expect(people[0]?.role).toBe("President and Managing Director");
    expect(people[0]?.pattern).toBe(EXTRACTION_PATTERN_L2A_SIEMENS_LEADERSHIP);
  });

  it("yields a validated Siemens candidate from profile-serp (employment gate)", () => {
    const fixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
      (f) => f.id === "del-costy-profile-serp",
    )!;
    const extracted = extractContactCandidates({
      company: "Siemens",
      results: [
        {
          title: fixture.title,
          description: fixture.description,
          url: fixture.provenance.url,
          source: "siemens.com",
          sourceKind: "official" as const,
        },
      ],
      themes,
    });
    expect(extracted).toHaveLength(1);
    expect(extracted[0]).toMatchObject({
      name: "Del Costy",
      role: "President and Managing Director",
      company: "Siemens",
      extractionPattern: EXTRACTION_PATTERN_L2A_SIEMENS_LEADERSHIP,
    });
  });

  it("neg 1: same structure for Schaeffler does not use L2-a", () => {
    const text =
      "### Jane Roe\nPresident and Managing Director, Americas Schaeffler AG\n\n- Biography";
    const people = extractPeopleFromText(text, {
      company: "Schaeffler",
      sourceUrl: "https://www.schaeffler.com/en/leadership/jane-roe",
    });
    expect(people).toEqual([]);
  });

  it("neg 2: President line without Siemens context does not extract", () => {
    const text = "### Jane Roe\nPresident and Managing Director, Americas Acme Industries";
    const people = extractPeopleFromText(text, {
      company: "Siemens",
      sourceUrl: "https://www.siemens.com/en-us/example",
    });
    expect(people).toEqual([]);
  });

  it("neg 3: interview mention on siemens.com without title/role-lead structure", () => {
    const text =
      "Siemens podcast highlights\nJane Roe spoke about digital trends. She is President at Acme Corp.";
    const people = extractPeopleFromText(text, {
      company: "Siemens",
      sourceUrl: "https://www.siemens.com/en-us/podcast",
    });
    expect(people).toEqual([]);
  });

  it("does not run L2-a without Siemens scope (no sourceUrl + wrong company)", () => {
    const fixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
      (f) => f.id === "del-costy-us-management-list",
    )!;
    expect(extractPeopleFromText(researchText(fixture))).toEqual([]);
  });
});
