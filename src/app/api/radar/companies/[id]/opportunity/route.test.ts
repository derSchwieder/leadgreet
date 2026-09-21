import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentAccountId,
  getCompanyById,
  findActiveOpportunityByCompany,
  findOrCreateOpportunityForCompany,
} = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  getCompanyById: vi.fn(),
  findActiveOpportunityByCompany: vi.fn(),
  findOrCreateOpportunityForCompany: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/companies", () => ({
  getCompanyById,
}));

vi.mock("@/lib/db/opportunities", () => ({
  findActiveOpportunityByCompany,
  findOrCreateOpportunityForCompany,
}));

import { GET, POST } from "./route";

describe("/api/radar/companies/[id]/opportunity", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    getCompanyById.mockReset();
    findActiveOpportunityByCompany.mockReset();
    findOrCreateOpportunityForCompany.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    getCompanyById.mockResolvedValue({ id: "co-1", name: "Schaeffler" });
    findActiveOpportunityByCompany.mockResolvedValue({ id: "opp-demo" });
    findOrCreateOpportunityForCompany.mockResolvedValue({
      opportunityId: "opp-demo",
      created: false,
    });
  });

  it("looks up the current account and ignores a client account override", async () => {
    const request = new Request(
      "http://localhost/api/radar/companies/co-1/opportunity?accountId=account-other",
    );
    const response = await GET(request, { params: Promise.resolve({ id: "co-1" }) });
    const body = await response.json();

    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(findActiveOpportunityByCompany).toHaveBeenCalledWith("account-demo", "co-1");
    expect(findActiveOpportunityByCompany).not.toHaveBeenCalledWith("account-other", "co-1");
    expect(body).toEqual({ opportunityId: "opp-demo" });
  });

  it("creates or opens for the current account and ignores a posted accountId", async () => {
    findOrCreateOpportunityForCompany.mockResolvedValue({
      opportunityId: "opp-created",
      created: true,
    });
    const response = await POST(
      new Request("http://localhost/api/radar/companies/co-1/opportunity?accountId=account-other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: "co-hijack", accountId: "account-other" }),
      }),
      { params: Promise.resolve({ id: "co-1" }) },
    );
    const body = await response.json();

    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(findOrCreateOpportunityForCompany).toHaveBeenCalledWith("account-demo", "co-1");
    expect(findOrCreateOpportunityForCompany).not.toHaveBeenCalledWith("account-other", "co-1");
    expect(findOrCreateOpportunityForCompany).not.toHaveBeenCalledWith("account-demo", "co-hijack");
    expect(body).toEqual({ opportunityId: "opp-created", created: true });
  });
});
