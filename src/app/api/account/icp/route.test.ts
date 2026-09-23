import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentAccountId, getAccountIcp, saveAccountIcp } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  getAccountIcp: vi.fn(),
  saveAccountIcp: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/account-icp", () => ({
  getAccountIcp,
  saveAccountIcp,
}));

import { GET, PUT } from "./route";

const icp = {
  industries: ["Industrie"],
  countries: ["Deutschland"],
  minEmployees: 100,
  minRevenue: 50_000_000,
};

describe("/api/account/icp", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    getAccountIcp.mockReset();
    saveAccountIcp.mockReset();
    getCurrentAccountId.mockResolvedValue("account-a");
    getAccountIcp.mockResolvedValue(icp);
    saveAccountIcp.mockResolvedValue(icp);
  });

  it("loads the ICP for the current account", async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(getAccountIcp).toHaveBeenCalledWith("account-a");
    expect(body.icp).toEqual(icp);
  });

  it("saves the ICP for the current account and ignores a client tenant override", async () => {
    const response = await PUT(
      new Request("http://localhost/api/account/icp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...icp,
          accountId: "account-other",
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(saveAccountIcp).not.toHaveBeenCalled();
  });

  it("saves industry, country, employees and revenue for the session account", async () => {
    const response = await PUT(
      new Request("http://localhost/api/account/icp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(icp),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(saveAccountIcp).toHaveBeenCalledWith("account-a", icp);
    expect(body.icp).toEqual(icp);
  });

  it("rejects negative minima", async () => {
    const response = await PUT(
      new Request("http://localhost/api/account/icp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...icp, minEmployees: -1 }),
      }),
    );
    expect(response.status).toBe(400);
    expect(saveAccountIcp).not.toHaveBeenCalled();
  });

  it("accepts empty filters as null minima", async () => {
    saveAccountIcp.mockResolvedValue({
      industries: [],
      countries: [],
      minEmployees: null,
      minRevenue: null,
    });
    const response = await PUT(
      new Request("http://localhost/api/account/icp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industries: [],
          countries: [],
          minEmployees: null,
          minRevenue: null,
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(saveAccountIcp).toHaveBeenCalledWith("account-a", {
      industries: [],
      countries: [],
      minEmployees: null,
      minRevenue: null,
    });
  });
});
