import { describe, expect, it } from "vitest";
import { projectRadarScopeDots } from "./radar-scope";

describe("projectRadarScopeDots", () => {
  it("places existing companies inside the circular radar", () => {
    const dots = projectRadarScopeDots([
      {
        companyId: "tv",
        name: "TeamViewer SE",
        latitude: 48.7054,
        longitude: 9.6511,
        greet: 75,
      },
      {
        companyId: "harting",
        name: "HARTING Technology Group",
        latitude: 52.3775,
        longitude: 8.6231,
        greet: 70,
      },
    ]);

    expect(dots).toHaveLength(2);
    expect(dots[0]?.id).toBe("tv");
    for (const dot of dots) {
      expect(Math.hypot(dot.x - 100, dot.y - 100)).toBeLessThanOrEqual(78.01);
    }
  });

  it("does not invent companies", () => {
    expect(projectRadarScopeDots([])).toEqual([]);
  });
});
