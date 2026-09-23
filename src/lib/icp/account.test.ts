import { describe, expect, it } from "vitest";
import { accountIcpSchema } from "@/lib/validation";
import { scoreCompanyGreet, scoreOpportunity, SCORING_WEIGHTS } from "@/lib/scoring";
import {
  EMPTY_ACCOUNT_ICP,
  eurosToMillionInput,
  millionToEuros,
  parseAccountIcp,
  parseEmployeesDraft,
  parseMillionDraft,
  toIcpProfile,
} from "./account";
import { matchesIcp } from "./match";

describe("account ICP persistence shape", () => {
  it("treats missing or empty JSON as an empty ICP", () => {
    expect(parseAccountIcp(null)).toEqual(EMPTY_ACCOUNT_ICP);
    expect(parseAccountIcp({})).toEqual(EMPTY_ACCOUNT_ICP);
    expect(parseAccountIcp({ industries: [], countries: [], minEmployees: null, minRevenue: null })).toEqual(
      EMPTY_ACCOUNT_ICP,
    );
  });

  it("stores industry, country, min employees and min revenue", () => {
    const icp = parseAccountIcp({
      industries: ["Industrie"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    });
    expect(icp).toEqual({
      industries: ["Industrie"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    });
    expect(toIcpProfile(icp)).toEqual({
      industries: ["Industrie"],
      countries: ["Deutschland"],
      employees: { min: 100 },
      revenue: { min: 50_000_000 },
    });
  });

  it("does not apply employees or revenue when the minimum is empty", () => {
    const profile = toIcpProfile(EMPTY_ACCOUNT_ICP);
    expect(profile.employees).toBeUndefined();
    expect(profile.revenue).toBeUndefined();
    expect(matchesIcp({ industry: null, country: null, employees: null, revenue: null }, profile)).toBe(
      true,
    );
  });

  it("rejects companies that lack employees or revenue when a minimum is set", () => {
    expect(
      matchesIcp(
        { employees: null, revenue: 80_000_000 },
        toIcpProfile({ ...EMPTY_ACCOUNT_ICP, minEmployees: 100 }),
      ),
    ).toBe(false);
    expect(
      matchesIcp(
        { employees: 200, revenue: null },
        toIcpProfile({ ...EMPTY_ACCOUNT_ICP, minRevenue: 50_000_000 }),
      ),
    ).toBe(false);
  });

  it("converts Mio. € input to the stored euro amount", () => {
    expect(millionToEuros(50)).toBe(50_000_000);
    expect(eurosToMillionInput(50_000_000)).toBe("50");
    expect(parseMillionDraft("50")).toEqual({ ok: true, value: 50_000_000 });
    expect(parseMillionDraft("")).toEqual({ ok: true, value: null });
    expect(parseMillionDraft("-1").ok).toBe(false);
    expect(parseEmployeesDraft("100")).toEqual({ ok: true, value: 100 });
    expect(parseEmployeesDraft("").ok).toBe(true);
    expect(parseEmployeesDraft("-4").ok).toBe(false);
  });

  it("rejects negative and unknown JSON fields", () => {
    expect(accountIcpSchema.safeParse({ minEmployees: -1 }).success).toBe(false);
    expect(accountIcpSchema.safeParse({ minRevenue: -1 }).success).toBe(false);
    expect(accountIcpSchema.safeParse({ accountId: "other" }).success).toBe(false);
    expect(parseAccountIcp({ minEmployees: -8 })).toEqual(EMPTY_ACCOUNT_ICP);
  });
});

describe("account ICP stays outside scoring", () => {
  it("does not change Company-Greet or Chance", () => {
    expect(SCORING_WEIGHTS.companyFit).toBe(20);
    const input = {
      now: new Date("2026-09-22T12:00:00.000Z"),
      company: {
        industry: "Software",
        subIndustry: null,
        country: "Deutschland",
        employees: null,
        companySize: null,
        website: "https://www.teamviewer.com",
        city: "Göppingen",
        revenue: null,
      },
      signals: [
        {
          type: "ERP_TRANSFORMATION" as const,
          detectedAt: new Date("2026-09-02T12:00:00.000Z"),
          eventDate: new Date("2026-09-02T12:00:00.000Z"),
          sourceType: "NEWS" as const,
          sourceCredibility: 85,
          sourceUrl: "https://news.sap.com/harting",
          title: "HARTING accelerates cloud transformation with RISE with SAP",
          description: "RISE with SAP.",
        },
      ],
      contact: null,
    };
    expect(scoreCompanyGreet(input)).toEqual(scoreOpportunity(input));
  });
});
