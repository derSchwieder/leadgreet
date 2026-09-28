import { describe, expect, it } from "vitest";
import {
  researchResultFromExtractionFixture,
  SIEMENS_EXTRACTION_AUDIT_FIXTURES,
} from "../../../../scripts/data/siemens-extraction-audit-fixtures";
import {
  extractContactCandidates,
  extractPeopleFromText,
  EXTRACTION_PATTERN_L2_SIEMENS_PRESS_APPOSITION,
} from "./extract";
import { validateContactCandidate } from "./quality";
import { deriveContactThemes } from "./themes";

function researchText(fixture: { title: string; description: string }): string {
  return `${fixture.title}\n${fixture.description}`;
}

function siemensScope(url: string) {
  return { company: "Siemens", sourceUrl: url };
}

describe("L2 Siemens press apposition (Peter Koorte)", () => {
  const themes = deriveContactThemes([], [
    "Digitale Transformation",
    "IT & Digitalization",
  ]);

  const pressFixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
    (f) => f.id === "peter-koorte-press-prose",
  )!;

  it("extracts Peter Koorte + CTO from press-prose fixture (Stage A)", () => {
    const people = extractPeopleFromText(
      researchText(pressFixture),
      siemensScope(pressFixture.provenance.url),
    );
    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({
      name: "Peter Koorte",
      role: "Chief Technology Officer",
      pattern: EXTRACTION_PATTERN_L2_SIEMENS_PRESS_APPOSITION,
    });
  });

  it("does not extract without Siemens scope", () => {
    expect(extractPeopleFromText(researchText(pressFixture))).toEqual([]);
  });

  it("yields a validated Siemens candidate from press-prose (employment compound)", () => {
    const result = researchResultFromExtractionFixture(pressFixture);
    const extracted = extractContactCandidates({
      company: "Siemens",
      results: [result],
      themes,
    });
    expect(extracted).toHaveLength(1);
    expect(extracted[0]).toMatchObject({
      name: "Peter Koorte",
      role: "Chief Technology Officer",
      company: "Siemens",
      extractionPattern: EXTRACTION_PATTERN_L2_SIEMENS_PRESS_APPOSITION,
    });
    expect(
      validateContactCandidate(
        {
          name: "Peter Koorte",
          role: "Chief Technology Officer",
          company: "Siemens",
          sourceUrl: result.url,
          evidence: [{ url: result.url, title: result.title }],
        },
        [result],
        "Siemens",
      ),
    ).toBeNull();
  });

  it("neg 1: apposition without C_LEVEL role does not match", () => {
    const text =
      "Peter Koorte, member of the Managing Board as well as member of an advisory council of Siemens AG.";
    const people = extractPeopleFromText(text, {
      company: "Siemens",
      sourceUrl: "https://press.siemens.com/global/en/pressrelease/example",
    });
    expect(people).toEqual([]);
  });

  it("neg 2: apposition with C_LEVEL but no Siemens employment context yields no candidate", () => {
    const text =
      "Jane Roe, board member as well as Chief Technology Officer of Acme Industries, will partner with Siemens AG on software.";
    const people = extractPeopleFromText(text, {
      company: "Siemens",
      sourceUrl: "https://press.siemens.com/global/en/pressrelease/acme-example",
    });
    expect(people).toHaveLength(1);
    expect(people[0]?.name).toBe("Jane Roe");
    const extracted = extractContactCandidates({
      company: "Siemens",
      results: [
        {
          title: "Partnership press release",
          description: text,
          url: "https://press.siemens.com/global/en/pressrelease/acme-example",
          source: "press.siemens.com",
          sourceKind: "news" as const,
        },
      ],
      themes,
    });
    expect(extracted).toEqual([]);
  });

  it("neg 3: Name, … as well as … without C_LEVEL does not match", () => {
    const text = "Jane Roe, longtime engineer as well as passionate mentor, spoke at Siemens.";
    const people = extractPeopleFromText(text, {
      company: "Siemens",
      sourceUrl: "https://press.siemens.com/global/en/pressrelease/example",
    });
    expect(people).toEqual([]);
  });

  it("neg 4: management-list fixture does not use press apposition", () => {
    const fixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
      (f) => f.id === "peter-koorte-management-heading",
    )!;
    const people = extractPeopleFromText(
      researchText(fixture),
      siemensScope(fixture.provenance.url),
    );
    expect(people).toEqual([]);
    const extracted = extractContactCandidates({
      company: "Siemens",
      results: [researchResultFromExtractionFixture(fixture)],
      themes,
    });
    expect(extracted).toEqual([]);
  });
});
