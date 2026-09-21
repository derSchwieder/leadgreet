import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/lib/db/serialize";

const { getCurrentAccountId, getContactForAccount, updateContactForAccount, deleteContactForAccount } =
  vi.hoisted(() => ({
    getCurrentAccountId: vi.fn(),
    getContactForAccount: vi.fn(),
    updateContactForAccount: vi.fn(),
    deleteContactForAccount: vi.fn(),
  }));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/contacts", () => ({
  getContactForAccount,
  updateContactForAccount,
  deleteContactForAccount,
}));

import { DELETE, PATCH } from "./route";

describe("/api/contacts/[id] tenant isolation", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    getContactForAccount.mockReset();
    updateContactForAccount.mockReset();
    deleteContactForAccount.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    updateContactForAccount.mockResolvedValue({
      id: "c-1",
      fullName: "Herr Meier",
      role: "CIO",
      notes: "Kurze Erstansprache",
    });
    deleteContactForAccount.mockResolvedValue({
      id: "c-1",
      fullName: "Herr Meier",
    });
  });

  it("updates a contact for the current account and ignores a client account override", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/contacts/c-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Kurze Erstansprache",
          accountId: "account-other",
        }),
      }),
      { params: Promise.resolve({ id: "c-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateContactForAccount).toHaveBeenCalledWith(
      "account-demo",
      "c-1",
      expect.objectContaining({ notes: "Kurze Erstansprache" }),
    );
    expect(updateContactForAccount.mock.calls[0]?.[2]).not.toHaveProperty("accountId");
    expect(body.contact.notes).toBe("Kurze Erstansprache");
  });

  it("rejects updating a foreign contact", async () => {
    updateContactForAccount.mockRejectedValue(new NotFoundError("Company", "co-foreign"));

    const response = await PATCH(
      new Request("http://localhost/api/contacts/c-foreign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: "Fremd" }),
      }),
      { params: Promise.resolve({ id: "c-foreign" }) },
    );

    expect(response.status).toBe(404);
    expect(updateContactForAccount).toHaveBeenCalledWith("account-demo", "c-foreign", expect.anything());
  });

  it("deletes an unreferenced contact for the current account", async () => {
    const response = await DELETE(new Request("http://localhost/api/contacts/c-1"), {
      params: Promise.resolve({ id: "c-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(deleteContactForAccount).toHaveBeenCalledWith("account-demo", "c-1");
    expect(body.contact.id).toBe("c-1");
  });

  it("does not delete a contact that is still referenced", async () => {
    deleteContactForAccount.mockRejectedValue(
      new ConflictError(
        "Dieser Kontakt ist in Aktivitäten oder To-dos hinterlegt und kann nicht entfernt werden.",
      ),
    );

    const response = await DELETE(new Request("http://localhost/api/contacts/c-used"), {
      params: Promise.resolve({ id: "c-used" }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain("Aktivitäten");
  });

  it("rejects deleting a foreign contact", async () => {
    deleteContactForAccount.mockRejectedValue(new NotFoundError("Company", "co-foreign"));

    const response = await DELETE(new Request("http://localhost/api/contacts/c-foreign"), {
      params: Promise.resolve({ id: "c-foreign" }),
    });

    expect(response.status).toBe(404);
    expect(deleteContactForAccount).toHaveBeenCalledWith("account-demo", "c-foreign");
  });
});
