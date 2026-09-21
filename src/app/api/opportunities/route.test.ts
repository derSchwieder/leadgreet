import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentAccountId, listOpportunities, createOpportunity } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  listOpportunities: vi.fn(),
  createOpportunity: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/opportunities", () => ({
  listOpportunities,
  createOpportunity,
}));

import { GET, POST } from "./route";

describe("/api/opportunities tenant isolation", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    listOpportunities.mockReset();
    createOpportunity.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    listOpportunities.mockResolvedValue([{ id: "opp-demo", accountId: "account-demo" }]);
    createOpportunity.mockResolvedValue({
      id: "opp-created",
      accountId: "account-demo",
      companyId: "co-1",
    });
  });

  it("lists opportunities for the current account only", async () => {
    const response = await GET();
    const body = await response.json();

    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(listOpportunities).toHaveBeenCalledWith("account-demo");
    expect(listOpportunities).not.toHaveBeenCalledWith("account-other");
    expect(body.opportunities).toEqual([{ id: "opp-demo", accountId: "account-demo" }]);
  });

  it("creates an opportunity for the current account and ignores a client account override", async () => {
    const response = await POST(
      new Request("http://localhost/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "co-1",
          title: "Schaeffler — Data Platform",
          accountId: "account-other",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(createOpportunity).toHaveBeenCalledOnce();
    expect(createOpportunity.mock.calls[0]?.[0]).toMatchObject({
      accountId: "account-demo",
      companyId: "co-1",
      title: "Schaeffler — Data Platform",
    });
    expect(createOpportunity.mock.calls[0]?.[0].accountId).not.toBe("account-other");
    expect(body.opportunity.accountId).toBe("account-demo");
  });
});
