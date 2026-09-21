import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/db/serialize";

const { getCurrentAccountId, createContactForAccount, listContacts } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  createContactForAccount: vi.fn(),
  listContacts: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/contacts", () => ({
  createContactForAccount,
  listContacts,
}));

import { POST } from "./route";

describe("/api/contacts tenant isolation", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    createContactForAccount.mockReset();
    listContacts.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    createContactForAccount.mockResolvedValue({
      id: "c-1",
      accountId: undefined,
      companyId: "co-1",
      firstName: "Herr",
      lastName: "Meier",
      fullName: "Herr Meier",
      role: "CIO",
      notes: "CIO bevorzugt kurze Erstansprache per E-Mail.",
    });
  });

  it("creates a contact for the current account and ignores a client account override", async () => {
    const response = await POST(
      new Request("http://localhost/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "co-1",
          firstName: "Herr",
          lastName: "Meier",
          role: "CIO",
          notes: "CIO bevorzugt kurze Erstansprache per E-Mail.",
          accountId: "account-other",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(createContactForAccount).toHaveBeenCalledOnce();
    expect(createContactForAccount.mock.calls[0]?.[0]).toBe("account-demo");
    expect(createContactForAccount.mock.calls[0]?.[1]).toMatchObject({
      companyId: "co-1",
      firstName: "Herr",
      lastName: "Meier",
      role: "CIO",
      notes: "CIO bevorzugt kurze Erstansprache per E-Mail.",
    });
    expect(createContactForAccount.mock.calls[0]?.[1]).not.toHaveProperty("accountId");
    expect(body.contact.fullName).toBe("Herr Meier");
    expect(body.contact.notes).toBe("CIO bevorzugt kurze Erstansprache per E-Mail.");
  });

  it("does not create a contact for a company without an account opportunity", async () => {
    createContactForAccount.mockRejectedValue(new NotFoundError("Company", "co-foreign"));

    const response = await POST(
      new Request("http://localhost/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "co-foreign",
          firstName: "Fremd",
          lastName: "Kontakt",
          role: "CEO",
          accountId: "account-other",
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(createContactForAccount).toHaveBeenCalledWith(
      "account-demo",
      expect.objectContaining({ companyId: "co-foreign" }),
    );
  });
});
