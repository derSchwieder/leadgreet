import { describe, expect, it } from "vitest";
import {
  matchLocalCompany,
  profileFromLocalCompany,
  researchLocalCompany,
} from "./local-company-researcher";
import type { CompanyCatalogPort, LocalCatalogCompany } from "./types";

const datev: LocalCatalogCompany = {
  id: "co-datev",
  name: "DATEV",
  legalName: "DATEV eG",
  website: "https://www.datev.de",
  industry: "Software",
  city: "Nürnberg",
  country: "DE",
  employees: 8000,
  revenue: "1200000000",
  ownership: "cooperative",
  description: "Software und Services für Steuerberater, Wirtschaftsprüfer und Unternehmen.",
};

const sparse: LocalCatalogCompany = {
  id: "co-sparse",
  name: "Sparse GmbH",
  legalName: null,
  website: null,
  industry: null,
  city: null,
  country: null,
  employees: null,
  revenue: null,
  ownership: null,
  description: null,
};

function catalogOf(companies: LocalCatalogCompany[]): CompanyCatalogPort {
  return {
    async findByNameOrDomain(input) {
      return matchLocalCompany(companies, input);
    },
    async listSignals() {
      return [];
    },
  };
}

describe("local company research", () => {
  it("returns catalog facts and a source for a known company", async () => {
    const finding = await researchLocalCompany(catalogOf([datev]), {
      name: "DATEV",
      domain: "datev.de",
    });
    expect(finding.available).toBe(true);
    expect(finding.companyId).toBe("co-datev");
    expect(finding.profile).toEqual(profileFromLocalCompany(datev));
    expect(finding.profile.companyName).toBe("DATEV eG");
    expect(finding.profile.domain).toBe("https://www.datev.de");
    expect(finding.sources).toEqual([
      {
        title: "DATEV",
        url: "https://www.datev.de",
        publisher: "Leadgreet Katalog",
        publishedAt: null,
      },
    ]);
  });

  it("does not invent a company that is not in the catalog", async () => {
    const finding = await researchLocalCompany(catalogOf([datev]), {
      name: "Unbekanntes Werk XYZ",
      domain: null,
    });
    expect(finding).toEqual({
      profile: {},
      sources: [],
      companyId: null,
      available: false,
    });
  });

  it("keeps missing catalog fields as null", async () => {
    const finding = await researchLocalCompany(catalogOf([sparse]), {
      name: "Sparse GmbH",
      domain: null,
    });
    expect(finding.available).toBe(true);
    expect(finding.profile.description).toBeNull();
    expect(finding.profile.industry).toBeNull();
    expect(finding.profile.employeeCount).toBeNull();
    expect(finding.profile.revenue).toBeNull();
    expect(finding.profile.companyType).toBeNull();
    expect(finding.profile.businessModel).toBeNull();
    expect(finding.profile.products).toBeNull();
    expect(finding.sources).toHaveLength(1);
  });
});
