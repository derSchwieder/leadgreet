import { describe, expect, it } from "vitest";
import { extractContactCandidates, extractPeopleFromText } from "./extract";
import { buildContactResearchQueries, MAX_CONTACT_QUERIES } from "./queries";
import {
  acceptContactCandidate,
  dedupeContactCandidates,
  extractPrivacyScanText,
  extractRoleEmployer,
  hasEmploymentAtScreenedCompany,
  hasPrivateContactData,
  validateContactCandidate,
} from "./quality";
import { scoreContactRelevance } from "./relevance";
import { deriveContactThemes } from "./themes";
import type { ContactResearchCandidate } from "./types";

const official = {
  title: "Jens Tester, Chief Digital Officer at Schaeffler",
  url: "https://www.schaeffler.com/newsroom/jens-tester",
  description: "Jens Tester, Chief Digital Officer at Schaeffler, leads digitalization.",
  source: "schaeffler.com",
  sourceKind: "official" as const,
};
const news = {
  title: "Jens Tester, Chief Digital Officer speaks on digitalization",
  url: "https://www.handelsblatt.com/schaeffler-cdo",
  description: "Jens Tester, Chief Digital Officer at Schaeffler discussed digitalization.",
  source: "handelsblatt.com",
  sourceKind: "news" as const,
};

function candidate(
  overrides: Partial<ContactResearchCandidate> = {},
): ContactResearchCandidate {
  return {
    name: "Jens Tester",
    role: "Chief Digital Officer",
    company: "Schaeffler",
    sourceUrl: official.url,
    sourceTitle: official.title,
    sourcePublisher: official.source,
    evidence: [{ url: official.url, title: official.title }],
    relevance: "high",
    relevanceReason: "Die Funktion ist mit Digitale Transformation verbunden.",
    relatedSignals: ["Digitale Transformation"],
    ...overrides,
  };
}

describe("contact quality rules", () => {
  it("accepts a candidate with name, role, company, and research evidence", () => {
    const accepted = acceptContactCandidate(candidate(), [official], "Schaeffler");
    expect(accepted?.name).toBe("Jens Tester");
    expect(validateContactCandidate(candidate(), [official], "Schaeffler")).toBeNull();
  });

  it("rejects a candidate without a name", () => {
    expect(validateContactCandidate(candidate({ name: "" }), [official], "Schaeffler")).toMatch(
      /name/i,
    );
  });

  it("rejects a candidate without a role", () => {
    expect(validateContactCandidate(candidate({ role: "   " }), [official], "Schaeffler")).toMatch(
      /role/i,
    );
  });

  it("rejects a candidate without evidence", () => {
    expect(
      validateContactCandidate(
        candidate({ sourceUrl: "", evidence: [] }),
        [official],
        "Schaeffler",
      ),
    ).toMatch(/evidence/i);
  });

  it("rejects an evidence URL outside the research results", () => {
    expect(
      validateContactCandidate(
        candidate({
          sourceUrl: "https://invented.example/jens",
          evidence: [{ url: "https://invented.example/jens" }],
        }),
        [official],
        "Schaeffler",
      ),
    ).toMatch(/not present/i);
  });
});

describe("privacy scan scope", () => {
  const wsjUrl =
    "https://www.wsj.com/articles/siemens-taps-osrams-hanna-hennig-as-cio-11573151590";
  const prUrl =
    "https://www.prnewswire.com/news-releases/ai-leader-vasi-philomin-joins-siemens-301234567.html";

  it("does not treat URL digit sequences as private phone numbers", () => {
    const blob = extractPrivacyScanText(
      {
        name: "Hanna Hennig",
        role: "CIO",
        company: "Siemens",
        sourceUrl: wsjUrl,
        evidence: [{ url: wsjUrl, title: "Siemens Taps Hanna Hennig as CIO - WSJ" }],
      },
      {
        title: "Siemens Taps Hanna Hennig as CIO - WSJ",
        description: "Hanna Hennig will lead digital transformation at Siemens AG.",
      },
    );
    expect(blob).not.toContain("11573151590");
    expect(hasPrivateContactData(blob)).toBe(false);
  });

  it("still detects real phone numbers and emails in snippet text", () => {
    expect(hasPrivateContactData("Contact Max Mustermann at +49 911 1234567")).toBe(true);
    expect(hasPrivateContactData("Contact: max.mustermann@example.com")).toBe(true);
    expect(
      hasPrivateContactData(
        extractPrivacyScanText(
          { name: "Max Mustermann", role: "CIO", company: "Siemens" },
          { title: "Press", description: "Media: press@siemens.com" },
        ),
      ),
    ).toBe(true);
  });

  it("validates Hanna Hennig WSJ result without URL false positive", () => {
    const wsj = {
      title: "Siemens Taps Osram's Hanna Hennig as CIO - WSJ",
      url: wsjUrl,
      description: "Hanna Hennig, the incoming chief information officer at Siemens AG, leads IT.",
      source: "wsj.com",
      sourceKind: "news" as const,
    };
    expect(
      validateContactCandidate(
        {
          name: "Hanna Hennig",
          role: "CIO",
          company: "Siemens",
          sourceUrl: wsj.url,
          evidence: [{ url: wsj.url, title: wsj.title }],
        },
        [wsj],
        "Siemens",
      ),
    ).toBeNull();
  });

  it("validates Vasi Philomin PRNewswire when snippet has no private contact data", () => {
    const themes = deriveContactThemes([], ["Digitale Transformation", "KI / AI", "IT & Digitalization"]);
    const pr = {
      title: "AI leader Vasi Philomin joins Siemens to scale Industrial AI innovation",
      url: prUrl,
      description:
        "Vasi Philomin has been appointed Executive Vice President and Head of Data & Artificial Intelligence. Vasi Philomin joins Siemens to scale Industrial AI.",
      source: "prnewswire.com",
      sourceKind: "news" as const,
    };
    const extracted = extractContactCandidates({ company: "Siemens", results: [pr], themes });
    expect(extracted.some((c) => c.name === "Vasi Philomin")).toBe(true);
  });

  it("rejects candidate when snippet contains a real press phone number", () => {
    const result = {
      title: "Executive appointment",
      url: "https://press.example.com/release",
      description: "For inquiries call +49 89 636 123456.",
      source: "press.example.com",
      sourceKind: "news" as const,
    };
    expect(
      validateContactCandidate(
        {
          name: "Max Mustermann",
          role: "CIO",
          company: "Siemens",
          sourceUrl: result.url,
          evidence: [{ url: result.url, title: result.title }],
        },
        [result],
        "Siemens",
      ),
    ).toMatch(/private contact/i);
  });
});

describe("contact extraction and company match", () => {
  it("deduplicates two research results for the same person", () => {
    const themes = deriveContactThemes([official, news]);
    const extracted = extractContactCandidates({
      company: "Schaeffler",
      results: [official, news],
      themes,
    });
    expect(extracted).toHaveLength(1);
    expect(extracted[0]?.name).toBe("Jens Tester");
    expect(extracted[0]?.evidence.map((item) => item.url)).toEqual(
      expect.arrayContaining([official.url, news.url]),
    );

    const merged = dedupeContactCandidates(
      [
        candidate({ sourceUrl: official.url, evidence: [{ url: official.url }] }),
        candidate({
          sourceUrl: news.url,
          evidence: [{ url: news.url }],
          relevance: "medium",
        }),
      ],
      [official, news],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.sourceUrl).toBe(official.url);
  });

  it("does not classify a partner employee as a company contact", () => {
    const partner = {
      title: "Anna Schmidt, CIO at Siemens",
      url: "https://www.siemens.com/events/schaeffler",
      description:
        "Anna Schmidt, CIO at Siemens, spoke at the Schaeffler partnership summit about AI.",
      source: "siemens.com",
      sourceKind: "other" as const,
    };
    const extracted = extractContactCandidates({
      company: "Schaeffler",
      results: [partner],
      themes: deriveContactThemes([partner], ["KI / AI"]),
    });
    expect(extracted).toEqual([]);
    expect(
      validateContactCandidate(
        candidate({
          name: "Anna Schmidt",
          role: "CIO",
          sourceUrl: partner.url,
          evidence: [{ url: partner.url }],
        }),
        [partner],
        "Schaeffler",
      ),
    ).toMatch(/employment|other company/i);
  });

  it("scores signal-aware relevance without a numeric score", () => {
    const digital = deriveContactThemes([], ["Digitale Transformation"]);
    const ai = deriveContactThemes([], ["KI / AI"]);
    expect(scoreContactRelevance("Head of Digitalization", digital)?.relevance).toBe("high");
    expect(scoreContactRelevance("Head of Digitalization", digital)?.relatedSignals).toContain(
      "Digitale Transformation",
    );
    expect(scoreContactRelevance("HR Manager", ai)).toBeNull();
  });

  describe("employment at screened company (compound titles)", () => {
    const company = "Schaeffler";
    const role = "CIO";

    it.each([
      "CIO bei Schaeffler",
      "CIO at Schaeffler",
      "CIO / IT & Digitalization bei Schaeffler",
      "CIO – IT & Digitalization bei Schaeffler",
      "CIO | IT & Digitalization bei Schaeffler",
    ])("accepts employment for %s", (snippet) => {
      expect(hasEmploymentAtScreenedCompany(snippet, company, role)).toBe(true);
    });

    it.each([
      "CIO at Siemens",
      "CIO bei Siemens",
      "CIO / Digitalization bei Siemens",
      "CIO for Siemens",
    ])("rejects employment for %s when screening Schaeffler", (snippet) => {
      expect(hasEmploymentAtScreenedCompany(snippet, company, role)).toBe(false);
    });

    it("accepts dual chief officer of Siemens AG (Koorte press compound)", () => {
      const snippet =
        "Chief Technology Officer and Chief Strategy Officer of Siemens AG";
      expect(extractRoleEmployer(snippet, "Chief Technology Officer")).toBe("Siemens AG");
      expect(hasEmploymentAtScreenedCompany(snippet, "Siemens", "Chief Technology Officer")).toBe(
        true,
      );
    });

    it("accepts simple Chief Technology Officer of Siemens AG (regression)", () => {
      const snippet = "Chief Technology Officer of Siemens AG";
      expect(extractRoleEmployer(snippet, "Chief Technology Officer")).toBe("Siemens AG");
      expect(hasEmploymentAtScreenedCompany(snippet, "Siemens", "Chief Technology Officer")).toBe(
        true,
      );
    });

    it("does not treat Siemens Energy as Siemens AG employment when screening Siemens", () => {
      const snippet =
        "Chief Technology Officer and Chief Strategy Officer of Siemens Energy";
      expect(extractRoleEmployer(snippet, "Chief Technology Officer")).toBe("Siemens Energy");
      expect(hasEmploymentAtScreenedCompany(snippet, "Siemens", "Chief Technology Officer")).toBe(
        false,
      );
    });

    it("rejects dual chief officer of another company when screening Siemens", () => {
      const snippet =
        "Chief Technology Officer and Chief Strategy Officer of Acme Industries";
      expect(hasEmploymentAtScreenedCompany(snippet, "Siemens", "Chief Technology Officer")).toBe(
        false,
      );
    });

    it("does not treat arbitrary and-title as chief officer compound", () => {
      const snippet = "Chief Technology Officer and random title of Siemens AG";
      expect(extractRoleEmployer(snippet, "Chief Technology Officer")).toBeNull();
      expect(hasEmploymentAtScreenedCompany(snippet, "Siemens", "Chief Technology Officer")).toBe(
        false,
      );
    });
  });

  describe("employment for and appointment context", () => {
    const siemens = "Siemens";
    const schaeffler = "Schaeffler";

    it.each([
      ["CIO for Siemens", "CIO", true],
      [
        "Since October 2016 Helmuth Ludwig is the Chief Information Officer (CIO) for Siemens.",
        "CIO",
        true,
      ],
      ["EVP Digitalization for Siemens", "EVP Digitalization", true],
    ])("accepts structured for-employment: %s", (snippet, role, expected) => {
      expect(hasEmploymentAtScreenedCompany(snippet, siemens, role)).toBe(expected);
    });

    it.each([
      "Digital transformation for Siemens",
      "Technology services for Siemens",
      "Consulting for Siemens",
    ])("rejects generic for phrase: %s", (snippet) => {
      expect(hasEmploymentAtScreenedCompany(snippet, siemens, "CIO")).toBe(false);
    });

    it("rejects CIO for Siemens when screening Schaeffler", () => {
      expect(hasEmploymentAtScreenedCompany("CIO for Siemens", schaeffler, "CIO")).toBe(false);
    });

    it("accepts Siemens appoints person as matching role", () => {
      const snippet =
        "Siemens Digital Industries appoints Dirk Didascalou as Chief Technology Officer.";
      expect(
        hasEmploymentAtScreenedCompany(snippet, siemens, "Chief Technology Officer", "Dirk Didascalou"),
      ).toBe(true);
    });

    it("rejects appointment when press role does not match candidate role", () => {
      const snippet = "Siemens appoints Max Mustermann as Chief Financial Officer.";
      expect(hasEmploymentAtScreenedCompany(snippet, siemens, "CIO", "Max Mustermann")).toBe(false);
    });

    it("accepts has been appointed at Siemens", () => {
      const snippet =
        "Max Mustermann has been appointed as EVP and Head of Data & AI at Siemens AG, effective July 1.";
      expect(
        hasEmploymentAtScreenedCompany(
          snippet,
          siemens,
          "Executive Vice President and Head of Data & AI",
          "Max Mustermann",
        ),
      ).toBe(true);
    });

    it("accepts joins Siemens plus has been appointed for same person", () => {
      const snippet =
        "AI leader Vasi Philomin joins Siemens to scale Industrial AI. Vasi Philomin has been appointed Executive Vice President and Head of Data & Artificial Intelligence, effective July 1, 2025.";
      expect(
        hasEmploymentAtScreenedCompany(
          snippet,
          siemens,
          "Executive Vice President and Head of Data & Artificial Intelligence",
          "Vasi Philomin",
        ),
      ).toBe(true);
    });

    it("accepts Helmuth Ludwig through full extract and validate path", () => {
      const themes = deriveContactThemes([], ["Digitale Transformation", "IT & Digitalization"]);
      const helmuth = {
        title: "How Siemens CDO deals with digitalization",
        url: "https://chief-digital-officers.com/en/how-siemens-cdo-deals-with-digitalization",
        description:
          "Since October 2016 Helmuth Ludwig is the Chief Information Officer (CIO) for Siemens.",
        source: "chief-digital-officers.com",
        sourceKind: "news" as const,
      };
      const extracted = extractContactCandidates({
        company: "Siemens",
        results: [helmuth],
        themes,
      });
      expect(extracted.some((c) => c.name === "Helmuth Ludwig")).toBe(true);
    });
  });

  it("extracts Marc Votteler from real-world title separators", () => {
    const themes = deriveContactThemes([], ["Digitale Transformation", "IT & Digitalization"]);
    const cases = [
      {
        title: "Marc Votteler – CIO / IT & Digitalization bei Schaeffler",
        url: "https://www.schaeffler.com/news/marc-votteler",
        description: "Marc Votteler – CIO / IT & Digitalization bei Schaeffler im Vorstand.",
      },
      {
        title: "Marc Votteler | CIO bei Schaeffler",
        url: "https://www.schaeffler.com/news/mv2",
        description: "Marc Votteler | CIO bei Schaeffler.",
      },
      {
        title: "Marc Votteler — CIO at Schaeffler",
        url: "https://www.schaeffler.com/news/mv3",
        description: "Marc Votteler — CIO at Schaeffler.",
      },
    ] as const;

    for (const item of cases) {
      const result = {
        ...item,
        source: "schaeffler.com",
        sourceKind: "official" as const,
      };
      const extracted = extractContactCandidates({
        company: "Schaeffler",
        results: [result],
        themes,
      });
      expect(extracted, item.title).toHaveLength(1);
      expect(extracted[0]?.name).toBe("Marc Votteler");
      expect(extracted[0]?.role).toMatch(/^CIO\b/i);
    }
  });

  it("does not extract impersonal or company-only dash titles", () => {
    const themes = deriveContactThemes([], ["Digitale Transformation"]);
    const noise = [
      {
        title: "Schaeffler – digitalization",
        url: "https://example.com/a",
        description: "Schaeffler – digitalization strategy overview.",
        source: "example.com",
        sourceKind: "news" as const,
      },
      {
        title: "IT – Schaeffler",
        url: "https://example.com/b",
        description: "IT – Schaeffler platform news.",
        source: "example.com",
        sourceKind: "news" as const,
      },
      {
        title: "CIO – digitalization",
        url: "https://example.com/c",
        description: "CIO – digitalization trends in automotive.",
        source: "example.com",
        sourceKind: "news" as const,
      },
    ];
    for (const result of noise) {
      expect(
        extractContactCandidates({ company: "Schaeffler", results: [result], themes }),
      ).toEqual([]);
    }
  });

  describe("Siemens live extraction patterns (for / appointment / EVP)", () => {
    const themes = deriveContactThemes([], [
      "Digitale Transformation",
      "IT & Digitalization",
      "KI / AI",
    ]);

    function result(title: string, description: string, url = "https://example.com/siemens") {
      return {
        title,
        url,
        description,
        source: "example.com",
        sourceKind: "news" as const,
      };
    }

    it("extracts Helmuth Ludwig from CIO-for-Siemens prose", () => {
      const text =
        "Since October 2016 Helmuth Ludwig is the Chief Information Officer (CIO) for Siemens.";
      const people = extractPeopleFromText(text);
      expect(people.some((p) => p.name === "Helmuth Ludwig" && p.role === "CIO")).toBe(true);
    });

    it("extracts Dirk Didascalou from appoints-as press title", () => {
      const text =
        "Siemens Digital Industries appoints Dirk Didascalou as Chief Technology Officer.";
      const people = extractPeopleFromText(text);
      expect(people[0]?.name).toBe("Dirk Didascalou");
      expect(people[0]?.role).toMatch(/Chief Technology Officer/i);
    });

    it("extracts Vasi Philomin from EVP appointment sentence", () => {
      const text =
        "Vasi Philomin has been appointed Executive Vice President and Head of Data & Artificial Intelligence, effective July 1, 2025.";
      const people = extractPeopleFromText(text);
      expect(people[0]?.name).toBe("Vasi Philomin");
      expect(people[0]?.role).toMatch(/Executive Vice President and Head of Data/i);
    });

    it("extracts Hanna Hennig from incoming CIO prose and as-CIO title", () => {
      const wsj =
        "Siemens Taps Osram's Hanna Hennig as CIO\nHanna Hennig, the incoming chief information officer at Siemens AG, will help lead digital transformation.";
      const people = extractPeopleFromText(wsj);
      expect(people.some((p) => p.name === "Hanna Hennig" && p.role === "CIO")).toBe(true);
    });

    it("extracts EVP from dash title for Siemens (raw role only)", () => {
      const people = extractPeopleFromText("Max Mustermann – EVP Digitalization for Siemens");
      expect(people[0]?.name).toBe("Max Mustermann");
      expect(people[0]?.role).toMatch(/^EVP Digitalization$/i);
    });

    it("passes relevance for extracted Chief Technology Officer via role hints", () => {
      const extracted = extractContactCandidates({
        company: "Siemens",
        results: [
          result(
            "Siemens appoints Dirk Didascalou as Chief Technology Officer",
            "Dirk Didascalou serves as Chief Technology Officer at Siemens AG today.",
            "https://press.siemens.com/cto",
          ),
        ],
        themes,
      });
      expect(extracted.some((c) => c.name === "Dirk Didascalou")).toBe(true);
    });

    it("does not extract a person from impersonal appointment headline", () => {
      expect(
        extractPeopleFromText("Siemens appoints a new EVP for digitalization."),
      ).toEqual([]);
      expect(
        extractContactCandidates({
          company: "Siemens",
          results: [
            result(
              "Siemens Appoints Chief Technology Officer",
              "Siemens has appointed a new technology leader for digitalization.",
            ),
          ],
          themes,
        }),
      ).toEqual([]);
    });

    it("does not extract a person from EVP line without a name", () => {
      expect(extractPeopleFromText("EVP Digitalization at Siemens continues.")).toEqual([]);
    });

    it("does not extract a person from digital transformation for Siemens", () => {
      expect(extractPeopleFromText("Digital transformation for Siemens accelerates.")).toEqual([]);
    });
  });

  it("Schaeffler regression: compound CIO title becomes a validated candidate", () => {
    const themes = deriveContactThemes([], ["IT & Digitalization", "Digitale Transformation"]);
    const votteler = {
      title: "Marc Votteler – CIO / IT & Digitalization bei Schaeffler",
      url: "https://www.schaeffler.com/en/media/news/marc-votteler",
      description:
        "Marc Votteler – CIO / IT & Digitalization bei Schaeffler verantwortet IT und Digitalisierung.",
      source: "schaeffler.com",
      sourceKind: "official" as const,
    };
    const extracted = extractContactCandidates({
      company: "Schaeffler",
      results: [votteler],
      themes,
    });
    expect(extracted).toHaveLength(1);
    expect(extracted[0]).toMatchObject({
      name: "Marc Votteler",
      role: "CIO",
      company: "Schaeffler",
      sourceUrl: votteler.url,
    });
    expect(validateContactCandidate(extracted[0]!, [votteler], "Schaeffler")).toBeNull();
  });

  it("builds at most five company-and-theme queries without person names", () => {
    const queries = buildContactResearchQueries(
      { name: "Schaeffler", domain: "schaeffler.com" },
      deriveContactThemes([], ["Digitale Transformation", "KI / AI"]),
    );
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.length).toBeLessThanOrEqual(MAX_CONTACT_QUERIES);
    expect(queries.every((query) => query.startsWith("Schaeffler"))).toBe(true);
    expect(queries.join(" ")).not.toMatch(/Jens Tester|Anna Schmidt/i);
  });
});
