import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentAccountId, setAccountCompanyState } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  setAccountCompanyState: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/account-company-state", () => ({
  setAccountCompanyState,
}));

import { PUT } from "./route";

const context = { params: Promise.resolve({ id: "company-1" }) };

describe("PUT /api/companies/[id]/state", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    setAccountCompanyState.mockReset();
    getCurrentAccountId.mockResolvedValue("account-a");
    setAccountCompanyState.mockResolvedValue({
      companyId: "company-1",
      status: "NOT_RELEVANT",
      note: null,
    });
  });

  it("stores NOT_RELEVANT for the current account", async () => {
    const response = await PUT(
      new Request("http://localhost/api/companies/company-1/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "NOT_RELEVANT" }),
      }),
      context,
    );
    expect(response.status).toBe(200);
    expect(setAccountCompanyState).toHaveBeenCalledWith(
      "account-a",
      "company-1",
      "NOT_RELEVANT",
      undefined,
    );
  });

  it("rejects a client tenant override", async () => {
    const response = await PUT(
      new Request("http://localhost/api/companies/company-1/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DECLINED", accountId: "account-other" }),
      }),
      context,
    );
    expect(response.status).toBe(400);
    expect(setAccountCompanyState).not.toHaveBeenCalled();
  });

  it("resets the company back into the radar", async () => {
    setAccountCompanyState.mockResolvedValue({
      companyId: "company-1",
      status: null,
      note: null,
    });
    const response = await PUT(
      new Request("http://localhost/api/companies/company-1/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: null }),
      }),
      context,
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(setAccountCompanyState).toHaveBeenCalledWith("account-a", "company-1", null, undefined);
    expect(body.state.status).toBeNull();
  });
});
