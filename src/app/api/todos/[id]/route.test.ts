import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/db/serialize";

const { getCurrentAccountId, completeSalesTodo } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  completeSalesTodo: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/todos", () => ({
  completeSalesTodo,
}));

import { PATCH } from "./route";

describe("/api/todos/[id] tenant isolation", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    completeSalesTodo.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    completeSalesTodo.mockResolvedValue({
      id: "todo-1",
      accountId: "account-demo",
      status: "DONE",
      completedAt: new Date("2026-09-18T12:00:00.000Z"),
    });
  });

  it("completes a todo for the current account", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/todos/todo-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      }),
      { params: Promise.resolve({ id: "todo-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(completeSalesTodo).toHaveBeenCalledWith("account-demo", "todo-1");
    expect(body.todo.status).toBe("DONE");
  });

  it("rejects completing a foreign todo", async () => {
    completeSalesTodo.mockRejectedValue(new NotFoundError("SalesTodo", "todo-foreign"));

    const response = await PATCH(
      new Request("http://localhost/api/todos/todo-foreign", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      }),
      { params: Promise.resolve({ id: "todo-foreign" }) },
    );

    expect(response.status).toBe(404);
  });
});
