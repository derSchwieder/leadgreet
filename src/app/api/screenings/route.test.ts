import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentAccountId,
  createManualCompanyScreening,
  listCompanyScreenings,
} = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  createManualCompanyScreening: vi.fn(),
  listCompanyScreenings: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/screenings", () => ({
  createManualCompanyScreening,
  listCompanyScreenings,
}));

import { GET, POST } from "./route";

const queued = {
  id: "scr-1",
  status: "QUEUED",
  inputName: "DATEV",
  inputDomain: null,
  companyId: null,
};

describe("/api/screenings", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    createManualCompanyScreening.mockReset();
    listCompanyScreenings.mockReset();
    getCurrentAccountId.mockResolvedValue("account-a");
    createManualCompanyScreening.mockResolvedValue(queued);
    listCompanyScreenings.mockResolvedValue([queued]);
  });

  it("creates a DATEV screening without a company and leaves it QUEUED", async () => {
    const response = await POST(
      new Request("http://localhost/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "DATEV" }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(createManualCompanyScreening).toHaveBeenCalledWith("account-a", {
      inputName: "DATEV",
      inputDomain: undefined,
      companyId: undefined,
    });
    expect(body.screening).toEqual({
      id: "scr-1",
      status: "QUEUED",
      inputName: "DATEV",
      inputDomain: null,
      companyId: null,
    });
  });

  it("stores an optional domain", async () => {
    createManualCompanyScreening.mockResolvedValue({
      ...queued,
      inputDomain: "datev.de",
    });
    const response = await POST(
      new Request("http://localhost/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "DATEV", domain: "datev.de" }),
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(createManualCompanyScreening).toHaveBeenCalledWith("account-a", {
      inputName: "DATEV",
      inputDomain: "datev.de",
    });
    expect(body.screening.inputDomain).toBe("datev.de");
    expect(body.screening.status).toBe("QUEUED");
    expect(body.screening.companyId).toBeNull();
  });

  it("lists screenings for the current account", async () => {
    const response = await GET(new Request("http://localhost/api/screenings?status=QUEUED"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(listCompanyScreenings).toHaveBeenCalledWith("account-a", {
      status: "QUEUED",
      companyId: undefined,
      limit: 50,
    });
    expect(body.screenings).toEqual([queued]);
  });

  it("lists screenings for a company", async () => {
    const response = await GET(
      new Request("http://localhost/api/screenings?companyId=company-1&limit=1"),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(listCompanyScreenings).toHaveBeenCalledWith("account-a", {
      status: undefined,
      companyId: "company-1",
      limit: 1,
    });
    expect(body.screenings).toEqual([queued]);
  });

  it("ignores a client tenant override", async () => {
    const response = await POST(
      new Request("http://localhost/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "DATEV", accountId: "account-other" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(createManualCompanyScreening).not.toHaveBeenCalled();
  });
});
