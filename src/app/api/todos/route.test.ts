import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/db/serialize";

const { getCurrentAccountId, createSalesTodo, listSalesTodos, listContacts } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  createSalesTodo: vi.fn(),
  listSalesTodos: vi.fn(),
  listContacts: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/todos", () => ({
  createSalesTodo,
  listSalesTodos,
}));

vi.mock("@/lib/db/contacts", () => ({
  listContacts,
}));

import { POST } from "./route";

describe("/api/todos tenant isolation", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    createSalesTodo.mockReset();
    listSalesTodos.mockReset();
    listContacts.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    createSalesTodo.mockResolvedValue({
      id: "todo-1",
      accountId: "account-demo",
      opportunityId: "opp-demo",
      companyId: "co-1",
      title: "Passenden Inhalt senden",
      dueAt: new Date("2026-10-02T00:00:00.000Z"),
      status: "OPEN",
    });
  });

  it("creates a todo for the current account and ignores a client account override", async () => {
    const response = await POST(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: "opp-demo",
          companyId: "co-1",
          title: "Passenden Inhalt senden",
          dueAt: "2026-10-02T00:00:00.000Z",
          accountId: "account-other",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(createSalesTodo).toHaveBeenCalledOnce();
    expect(createSalesTodo.mock.calls[0]?.[0]).toBe("account-demo");
    expect(createSalesTodo.mock.calls[0]?.[1]).toMatchObject({
      opportunityId: "opp-demo",
      companyId: "co-1",
      title: "Passenden Inhalt senden",
    });
    expect(createSalesTodo.mock.calls[0]?.[1]).not.toHaveProperty("accountId");
    expect(body.todo.accountId).toBe("account-demo");
  });

  it("creates a todo when optional contact and activity fields are omitted", async () => {
    const response = await POST(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: "opp-demo",
          companyId: "co-1",
          title: "nachrufen",
          dueAt: "2026-09-30T12:30:00.000Z",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createSalesTodo.mock.calls[0]?.[1]).toMatchObject({
      opportunityId: "opp-demo",
      companyId: "co-1",
      title: "nachrufen",
    });
    expect(createSalesTodo.mock.calls[0]?.[1].contactId ?? null).toBeNull();
    expect(createSalesTodo.mock.calls[0]?.[1].relatedActivityId ?? null).toBeNull();
  });

  it("does not create a todo for a foreign opportunity", async () => {
    createSalesTodo.mockRejectedValue(new NotFoundError("Opportunity", "opp-foreign"));

    const response = await POST(
      new Request("http://localhost/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: "opp-foreign",
          companyId: "co-1",
          title: "Fremdes To-do",
          dueAt: "2026-10-02T00:00:00.000Z",
          accountId: "account-other",
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(createSalesTodo).toHaveBeenCalledWith(
      "account-demo",
      expect.objectContaining({ opportunityId: "opp-foreign" }),
    );
  });
});
