import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentAccountId, listRadarPoints } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  listRadarPoints: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/radar", () => ({
  listRadarPoints,
}));

import { GET } from "./route";

describe("GET /api/radar", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    listRadarPoints.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    listRadarPoints.mockResolvedValue([
      {
        companyId: "co-1",
        name: "VIA optronics",
        city: "Nürnberg",
        country: "Deutschland",
        latitude: 49.4521,
        longitude: 11.0767,
        greet: 73,
        signalTitle: "[DEMO] Signal",
        website: null,
      },
    ]);
  });

  it("uses the current account context and does not accept an account override", async () => {
    const response = await GET();
    const body = await response.json();

    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(listRadarPoints).toHaveBeenCalledWith("account-demo");
    expect(listRadarPoints).not.toHaveBeenCalledWith("account-other");
    expect(body).toEqual({
      points: [
        {
          companyId: "co-1",
          name: "VIA optronics",
          city: "Nürnberg",
          country: "Deutschland",
          latitude: 49.4521,
          longitude: 11.0767,
          greet: 73,
          signalTitle: "[DEMO] Signal",
          website: null,
        },
      ],
    });
    expect(JSON.stringify(body)).not.toContain("account-demo");
  });
});
