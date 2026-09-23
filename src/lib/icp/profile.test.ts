import { describe, expect, it } from "vitest";
import { EMPTY_ACCOUNT_ICP } from "./account";
import {
  clampGreetThreshold,
  matchesRadarProfile,
  radarProfileFromAccountIcp,
  storedIcpFromRadarProfile,
} from "./profile";

const bmw = {
  industry: "Automobil",
  country: "Deutschland",
  employees: 140000,
  revenue: 150_000_000_000,
};

const swissSoft = {
  industry: "Software",
  country: "Schweiz",
  employees: 80,
  revenue: 20_000_000,
};

const blank = {
  industry: null,
  country: null,
  employees: null,
  revenue: null,
};

describe("radarProfileFromAccountIcp", () => {
  it("copies the stored ICP 1:1 onto an active radar with greet 0", () => {
    const icp = {
      industries: ["Automobil"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    };
    expect(radarProfileFromAccountIcp(icp)).toEqual({
      name: "Mein Radar",
      industries: ["Automobil"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
      greetThreshold: 0,
      isActive: true,
    });
    expect(storedIcpFromRadarProfile(radarProfileFromAccountIcp(icp))).toEqual(icp);
  });

  it("keeps empty ICP fields empty", () => {
    expect(radarProfileFromAccountIcp(EMPTY_ACCOUNT_ICP)).toEqual({
      name: "Mein Radar",
      industries: [],
      countries: [],
      minEmployees: null,
      minRevenue: null,
      greetThreshold: 0,
      isActive: true,
    });
  });
});

describe("matchesRadarProfile ICP", () => {
  const empty = radarProfileFromAccountIcp(EMPTY_ACCOUNT_ICP);

  it("matches every company when the radar ICP is empty", () => {
    expect(matchesRadarProfile(bmw, 40, empty)).toBe(true);
    expect(matchesRadarProfile(blank, 0, empty)).toBe(true);
  });

  it("filters by industry", () => {
    const profile = radarProfileFromAccountIcp({
      ...EMPTY_ACCOUNT_ICP,
      industries: ["Automobil"],
    });
    expect(matchesRadarProfile(bmw, 80, profile)).toBe(true);
    expect(matchesRadarProfile(swissSoft, 80, profile)).toBe(false);
    expect(matchesRadarProfile(blank, 80, profile)).toBe(false);
  });

  it("filters by country", () => {
    const profile = radarProfileFromAccountIcp({
      ...EMPTY_ACCOUNT_ICP,
      countries: ["Deutschland"],
    });
    expect(matchesRadarProfile(bmw, 80, profile)).toBe(true);
    expect(matchesRadarProfile(swissSoft, 80, profile)).toBe(false);
    expect(matchesRadarProfile(blank, 80, profile)).toBe(false);
  });

  it("filters by employees", () => {
    const profile = radarProfileFromAccountIcp({
      ...EMPTY_ACCOUNT_ICP,
      minEmployees: 100,
    });
    expect(matchesRadarProfile(bmw, 80, profile)).toBe(true);
    expect(matchesRadarProfile(swissSoft, 80, profile)).toBe(false);
    expect(matchesRadarProfile({ ...bmw, employees: null }, 80, profile)).toBe(false);
  });

  it("filters by revenue", () => {
    const profile = radarProfileFromAccountIcp({
      ...EMPTY_ACCOUNT_ICP,
      minRevenue: 50_000_000,
    });
    expect(matchesRadarProfile(bmw, 80, profile)).toBe(true);
    expect(matchesRadarProfile(swissSoft, 80, profile)).toBe(false);
    expect(matchesRadarProfile({ ...bmw, revenue: null }, 80, profile)).toBe(false);
  });

  it("requires every set dimension at once", () => {
    const profile = radarProfileFromAccountIcp({
      industries: ["Automobil"],
      countries: ["Deutschland"],
      minEmployees: 100,
      minRevenue: 50_000_000,
    });
    expect(matchesRadarProfile(bmw, 80, profile)).toBe(true);
    expect(matchesRadarProfile({ ...bmw, industry: "Software" }, 80, profile)).toBe(false);
    expect(matchesRadarProfile({ ...bmw, country: "Schweiz" }, 80, profile)).toBe(false);
    expect(matchesRadarProfile({ ...bmw, employees: 20 }, 80, profile)).toBe(false);
    expect(matchesRadarProfile({ ...bmw, revenue: 1_000_000 }, 80, profile)).toBe(false);
  });
});

describe("matchesRadarProfile greet threshold", () => {
  const empty = radarProfileFromAccountIcp(EMPTY_ACCOUNT_ICP);

  it("keeps every ICP match at threshold 0", () => {
    expect(matchesRadarProfile(bmw, 0, { ...empty, greetThreshold: 0 })).toBe(true);
  });

  it("requires greet 50, 75 and 100", () => {
    expect(matchesRadarProfile(bmw, 49, { ...empty, greetThreshold: 50 })).toBe(false);
    expect(matchesRadarProfile(bmw, 50, { ...empty, greetThreshold: 50 })).toBe(true);
    expect(matchesRadarProfile(bmw, 74, { ...empty, greetThreshold: 75 })).toBe(false);
    expect(matchesRadarProfile(bmw, 75, { ...empty, greetThreshold: 75 })).toBe(true);
    expect(matchesRadarProfile(bmw, 99, { ...empty, greetThreshold: 100 })).toBe(false);
    expect(matchesRadarProfile(bmw, 100, { ...empty, greetThreshold: 100 })).toBe(true);
  });

  it("clamps an invalid threshold to 0–100", () => {
    expect(clampGreetThreshold(-4)).toBe(0);
    expect(clampGreetThreshold(140)).toBe(100);
    expect(clampGreetThreshold(75.4)).toBe(75);
  });
});
