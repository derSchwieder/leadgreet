import { describe, expect, it } from "vitest";
import {
  SIEMENS_EXTRACTION_AUDIT_FIXTURES,
  SIEMENS_ROLE_THEN_NAME_FIXTURES,
} from "../../../../scripts/data/siemens-extraction-audit-fixtures";
import {
  extractContactCandidates,
  extractPeopleFromText,
  EXTRACTION_PATTERN_ROLE_THEN_NAME,
} from "./extract";
import { deriveContactThemes } from "./themes";

function researchText(fixture: { title: string; description: string }): string {
  return `${fixture.title}\n${fixture.description}`;
}

function roleThenNameMatches(text: string) {
  return extractPeopleFromText(text).filter(
    (person) => person.pattern === EXTRACTION_PATTERN_ROLE_THEN_NAME,
  );
}

describe("L1.1 ROLE_THEN_NAME guards (Siemens audit fixtures)", () => {
  describe("negative fixtures — no ROLE_THEN_NAME extraction", () => {
    const negatives = SIEMENS_ROLE_THEN_NAME_FIXTURES.filter(
      (fixture) => fixture.category === "role_then_name_false_positive",
    );

    it.each(negatives.map((fixture) => [fixture.id, fixture] as const))(
      "%s",
      (_id, fixture) => {
        const text = researchText(fixture);
        expect(roleThenNameMatches(text)).toEqual([]);
        const target = fixture.targetAfterL1_1?.people ?? [];
        const allPeople = extractPeopleFromText(text).map(({ name, role }) => ({ name, role }));
        expect(allPeople).toEqual(target);
      },
    );
  });

  describe("positive ROLE_THEN_NAME fixture", () => {
    it("extracts Dirk Didascalou from employment prose with provenance", () => {
      const text = "Chief Technology Officer Dirk Didascalou at Siemens AG today.";
      const matches = roleThenNameMatches(text);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({
        name: "Dirk Didascalou",
        role: "Chief Technology Officer",
        pattern: EXTRACTION_PATTERN_ROLE_THEN_NAME,
      });
    });

    it("audit fixture includes ROLE_THEN_NAME phrase in description path", () => {
      const fixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
        (item) => item.id === "role-then-name-dirk-thin-description",
      );
      expect(fixture).toBeDefined();
      const phrase = "Chief Technology Officer Dirk Didascalou at Siemens AG today.";
      expect(fixture!.description).toContain("Chief Technology Officer");
      expect(roleThenNameMatches(phrase)).toHaveLength(1);
    });
  });

  describe("regression fixtures — must still extract (any pattern)", () => {
    const regressions = SIEMENS_EXTRACTION_AUDIT_FIXTURES.filter(
      (fixture) => fixture.category === "regression_must_extract",
    );

    it.each(regressions.map((fixture) => [fixture.id, fixture] as const))(
      "%s",
      (_id, fixture) => {
        const people = extractPeopleFromText(researchText(fixture));
        const target = fixture.targetAfterL1_1?.people ?? fixture.observedStageA.people;
        for (const expected of target) {
          expect(
            people.some(
              (person) =>
                person.name === expected.name &&
                person.role.toLocaleLowerCase("de").includes(
                  expected.role.split(/\s+/)[0]!.toLocaleLowerCase("de"),
                ),
            ),
          ).toBe(true);
        }
      },
    );
  });
});

describe("G1 colon NAME_THEN_ROLE label guard", () => {
  it("does not extract Partners Read from podcast title fixture", () => {
    const fixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
      (item) => item.id === "role-then-name-partners-read-podcast",
    );
    expect(fixture).toBeDefined();
    const people = extractPeopleFromText(researchText(fixture!));
    expect(people).toEqual([]);
    expect(people.some((p) => p.name === "Partners Read")).toBe(false);
  });

  it("extracts Tom Jones from genuine Name: Role at company colon line", () => {
    const people = extractPeopleFromText("Tom Jones: Chief Digital Officer at Siemens AG");
    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({
      name: "Tom Jones",
      role: "Chief Digital Officer",
    });
  });

  it("extractContactCandidates stays empty for Partners Read fixture (Siemens)", () => {
    const fixture = SIEMENS_EXTRACTION_AUDIT_FIXTURES.find(
      (item) => item.id === "role-then-name-partners-read-podcast",
    );
    expect(fixture).toBeDefined();
    const themes = deriveContactThemes([], ["Digitale Transformation", "IT & Digitalization"]);
    const extracted = extractContactCandidates({
      company: "Siemens",
      results: [
        {
          title: fixture!.title,
          description: fixture!.description,
          url: fixture!.provenance.url,
          source: "example.com",
          sourceKind: "news" as const,
        },
      ],
      themes,
    });
    expect(extracted).toEqual([]);
  });
});

describe("L1.1 ROLE_THEN_NAME provenance on contact candidates", () => {
  const themes = deriveContactThemes([], [
    "Digitale Transformation",
    "IT & Digitalization",
    "KI / AI",
  ]);

  it("copies extractionPattern onto accepted candidates when present on the match", () => {
    const extracted = extractContactCandidates({
      company: "Siemens",
      results: [
        {
          title: "Siemens appoints Dirk Didascalou as Chief Technology Officer",
          url: "https://press.siemens.com/cto",
          description: "Dirk Didascalou serves as Chief Technology Officer at Siemens AG today.",
          source: "press.siemens.com",
          sourceKind: "official" as const,
        },
      ],
      themes,
    });
    expect(extracted.some((c) => c.name === "Dirk Didascalou")).toBe(true);
    const dirk = extracted.find((c) => c.name === "Dirk Didascalou");
    expect(dirk?.extractionPattern).toBeUndefined();
    const roleThenNameOnly = extractPeopleFromText(
      "Chief Technology Officer Dirk Didascalou at Siemens AG today.",
    );
    expect(roleThenNameOnly[0]?.pattern).toBe(EXTRACTION_PATTERN_ROLE_THEN_NAME);
  });
});
