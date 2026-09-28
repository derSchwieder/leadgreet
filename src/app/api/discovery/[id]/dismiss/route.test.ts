import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/db/serialize";

const { dismissUnresolvedSignal } = vi.hoisted(() => ({
  dismissUnresolvedSignal: vi.fn(),
}));

vi.mock("@/lib/db/discovery", () => ({
  dismissUnresolvedSignal,
}));

import { POST } from "./route";

describe("POST /api/discovery/:id/dismiss", () => {
  beforeEach(() => {
    dismissUnresolvedSignal.mockReset();
    dismissUnresolvedSignal.mockResolvedValue({ id: "disc-1", status: "DISMISSED" });
  });

  it("marks an item as DISMISSED", async () => {
    const response = await POST(
      new Request("http://localhost/api/discovery/disc-1/dismiss", { method: "POST" }),
      { params: Promise.resolve({ id: "disc-1" }) },
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(dismissUnresolvedSignal).toHaveBeenCalledWith("disc-1");
    expect(body.item.status).toBe("DISMISSED");
  });

  it("returns 404 when the item is missing", async () => {
    dismissUnresolvedSignal.mockRejectedValue(new NotFoundError("UnresolvedSignal", "missing"));
    const response = await POST(
      new Request("http://localhost/api/discovery/missing/dismiss", { method: "POST" }),
      { params: Promise.resolve({ id: "missing" }) },
    );
    expect(response.status).toBe(404);
  });
});
