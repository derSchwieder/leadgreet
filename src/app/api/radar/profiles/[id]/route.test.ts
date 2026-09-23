import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentAccountId, getRadarProfile, updateRadarProfile, deleteRadarProfile } =
  vi.hoisted(() => ({
    getCurrentAccountId: vi.fn(),
    getRadarProfile: vi.fn(),
    updateRadarProfile: vi.fn(),
    deleteRadarProfile: vi.fn(),
  }));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/radar-profiles", () => ({
  getRadarProfile,
  updateRadarProfile,
  deleteRadarProfile,
}));

import { DELETE, GET, PATCH } from "./route";

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

const context = { params: Promise.resolve({ id: "radar-1" }) };

describe("/api/radar/profiles/[id]", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    getRadarProfile.mockReset();
    updateRadarProfile.mockReset();
    deleteRadarProfile.mockReset();
    getCurrentAccountId.mockResolvedValue("account-a");
    getRadarProfile.mockResolvedValue(profile);
    updateRadarProfile.mockResolvedValue({ ...profile, greetThreshold: 50 });
    deleteRadarProfile.mockResolvedValue(undefined);
  });

  it("reads a radar for the current account", async () => {
    const response = await GET(new Request("http://localhost/api/radar/profiles/radar-1"), context);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(getRadarProfile).toHaveBeenCalledWith("account-a", "radar-1");
    expect(body.profile).toEqual(profile);
  });

  it("rejects a client tenant override on patch", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/radar/profiles/radar-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greetThreshold: 50, accountId: "account-other" }),
      }),
      context,
    );
    expect(response.status).toBe(400);
    expect(updateRadarProfile).not.toHaveBeenCalled();
  });

  it("updates and deletes a radar for the session account", async () => {
    const patched = await PATCH(
      new Request("http://localhost/api/radar/profiles/radar-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greetThreshold: 50 }),
      }),
      context,
    );
    expect(patched.status).toBe(200);
    expect(updateRadarProfile).toHaveBeenCalledWith(
      "account-a",
      "radar-1",
      expect.objectContaining({ greetThreshold: 50 }),
    );

    const deleted = await DELETE(
      new Request("http://localhost/api/radar/profiles/radar-1", { method: "DELETE" }),
      context,
    );
    expect(deleted.status).toBe(200);
    expect(deleteRadarProfile).toHaveBeenCalledWith("account-a", "radar-1");
  });
});
