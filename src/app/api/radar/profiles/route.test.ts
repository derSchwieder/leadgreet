import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentAccountId,
  listRadarProfiles,
  createRadarProfile,
} = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  listRadarProfiles: vi.fn(),
  createRadarProfile: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/radar-profiles", () => ({
  listRadarProfiles,
  createRadarProfile,
}));

import { GET, POST } from "./route";

const profile = {
  id: "radar-1",
  name: "Mein Radar",
  industries: ["Automobil"],
  countries: ["Deutschland"],
  minEmployees: 100,
  minRevenue: 50_000_000,
  greetThreshold: 0,
  isActive: true,
};

describe("/api/radar/profiles", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    listRadarProfiles.mockReset();
    createRadarProfile.mockReset();
    getCurrentAccountId.mockResolvedValue("account-a");
    listRadarProfiles.mockResolvedValue([profile]);
    createRadarProfile.mockResolvedValue({ ...profile, id: "radar-2", name: "Banken" });
  });

  it("lists radars for the current account", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(listRadarProfiles).toHaveBeenCalledWith("account-a");
    expect(body.profiles).toEqual([profile]);
    expect(createRadarProfile).not.toHaveBeenCalled();
  });

  it("returns an empty list without creating a default radar", async () => {
    listRadarProfiles.mockResolvedValue([]);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.profiles).toEqual([]);
    expect(createRadarProfile).not.toHaveBeenCalled();
  });

  it("creates a radar for the session account and ignores a client tenant override", async () => {
    const response = await POST(
      new Request("http://localhost/api/radar/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Banken",
          accountId: "account-other",
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(createRadarProfile).not.toHaveBeenCalled();
  });

  it("creates a radar for the session account", async () => {
    const response = await POST(
      new Request("http://localhost/api/radar/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Banken",
          industries: ["Banken"],
          countries: ["Deutschland"],
          minEmployees: 50,
          minRevenue: null,
          greetThreshold: 75,
        }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(createRadarProfile).toHaveBeenCalledWith(
      "account-a",
      expect.objectContaining({
        name: "Banken",
        industries: ["Banken"],
        greetThreshold: 75,
      }),
    );
    expect(body.profile.name).toBe("Banken");
  });
});
