import { describe, expect, it } from "vitest";
import {
  countVisibleRadarPoints,
  filterVisibleRadarPoints,
  matchesRadarSensitivity,
} from "./sensitivity";

describe("matchesRadarSensitivity", () => {
  it("shows every company at threshold 0", () => {
    expect(matchesRadarSensitivity(0, 0)).toBe(true);
    expect(matchesRadarSensitivity(75, 0)).toBe(true);
  });

  it("keeps companies with Greet at or above the threshold", () => {
    expect(matchesRadarSensitivity(75, 75)).toBe(true);
    expect(matchesRadarSensitivity(82, 75)).toBe(true);
    expect(matchesRadarSensitivity(74, 75)).toBe(false);
  });

  it("keeps only Greet 100 at threshold 100", () => {
    expect(matchesRadarSensitivity(99, 100)).toBe(false);
    expect(matchesRadarSensitivity(100, 100)).toBe(true);
  });
});

describe("filterVisibleRadarPoints", () => {
  const points = [
    { companyId: "em", greet: 72 },
    { companyId: "ars", greet: 75 },
    { companyId: "schaeffler", greet: 82 },
    { companyId: "perfect", greet: 100 },
  ];

  it("keeps the same companies the map would show for a Greet threshold", () => {
    expect(filterVisibleRadarPoints(points, 0).map((point) => point.companyId)).toEqual([
      "em",
      "ars",
      "schaeffler",
      "perfect",
    ]);
    expect(filterVisibleRadarPoints(points, 75).map((point) => point.companyId)).toEqual([
      "ars",
      "schaeffler",
      "perfect",
    ]);
    expect(filterVisibleRadarPoints(points, 100).map((point) => point.companyId)).toEqual([
      "perfect",
    ]);
  });

  it("does not mutate the original points", () => {
    const original = [...points];
    filterVisibleRadarPoints(points, 80);
    expect(points).toEqual(original);
  });
});

describe("countVisibleRadarPoints", () => {
  const points = [{ greet: 72 }, { greet: 75 }, { greet: 82 }, { greet: 100 }];

  it("counts all companies at 0, a subset at 75, and only 100 at 100", () => {
    expect(countVisibleRadarPoints(points, 0)).toBe(4);
    expect(countVisibleRadarPoints(points, 75)).toBe(3);
    expect(countVisibleRadarPoints(points, 100)).toBe(1);
    expect(countVisibleRadarPoints(points, 75)).toBe(filterVisibleRadarPoints(points, 75).length);
  });
});
