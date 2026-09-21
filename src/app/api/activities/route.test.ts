import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/db/serialize";

const { getCurrentAccountId, createActivity, listActivities, listContacts } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  createActivity: vi.fn(),
  listActivities: vi.fn(),
  listContacts: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/activities", () => ({
  createActivity,
  listActivities,
}));

vi.mock("@/lib/db/contacts", () => ({
  listContacts,
}));

import { POST } from "./route";

describe("/api/activities tenant isolation", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    createActivity.mockReset();
    listActivities.mockReset();
    listContacts.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    createActivity.mockResolvedValue({
      id: "act-1",
      accountId: "account-demo",
      opportunityId: "opp-demo",
      companyId: "co-1",
      type: "EMAIL_SENT",
      note: "Passenden Inhalt senden",
      occurredAt: new Date("2026-09-18T10:00:00.000Z"),
    });
  });

  it("creates an activity for the current account and ignores a client account override", async () => {
    const response = await POST(
      new Request("http://localhost/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: "opp-demo",
          companyId: "co-1",
          type: "EMAIL_SENT",
          note: "Passenden Inhalt senden",
          occurredAt: "2026-09-18T10:00:00.000Z",
          accountId: "account-other",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(createActivity).toHaveBeenCalledOnce();
    expect(createActivity.mock.calls[0]?.[0]).toBe("account-demo");
    expect(createActivity.mock.calls[0]?.[0]).not.toBe("account-other");
    expect(createActivity.mock.calls[0]?.[1]).toMatchObject({
      opportunityId: "opp-demo",
      companyId: "co-1",
      type: "EMAIL_SENT",
      note: "Passenden Inhalt senden",
    });
    expect(createActivity.mock.calls[0]?.[1]).not.toHaveProperty("accountId");
    expect(body.activity.accountId).toBe("account-demo");
  });

  it("does not create an activity for a foreign opportunity", async () => {
    createActivity.mockRejectedValue(new NotFoundError("Opportunity", "opp-foreign"));

    const response = await POST(
      new Request("http://localhost/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: "opp-foreign",
          companyId: "co-1",
          type: "CALL",
          note: "Anruf",
          occurredAt: "2026-09-18T10:00:00.000Z",
          accountId: "account-other",
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(createActivity).toHaveBeenCalledWith(
      "account-demo",
      expect.objectContaining({ opportunityId: "opp-foreign" }),
    );
  });
});
