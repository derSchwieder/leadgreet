import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/lib/db/serialize";

const { reviewUnresolvedSignal } = vi.hoisted(() => ({
  reviewUnresolvedSignal: vi.fn(),
}));

vi.mock("@/lib/db/discovery", () => ({
  reviewUnresolvedSignal,
}));

import { POST } from "./route";

describe("POST /api/discovery/:id/review", () => {
  beforeEach(() => {
    reviewUnresolvedSignal.mockReset();
    reviewUnresolvedSignal.mockResolvedValue({ id: "disc-1", status: "REVIEWED" });
  });

  it("marks a new item as REVIEWED", async () => {
    const response = await POST(new Request("http://localhost/api/discovery/disc-1/review"), {
      params: Promise.resolve({ id: "disc-1" }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(reviewUnresolvedSignal).toHaveBeenCalledWith("disc-1");
    expect(body.item.status).toBe("REVIEWED");
  });

  it("returns 404 when the item is missing", async () => {
    reviewUnresolvedSignal.mockRejectedValue(new NotFoundError("UnresolvedSignal", "missing"));
    const response = await POST(new Request("http://localhost/api/discovery/missing/review"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 409 when the item cannot be reviewed", async () => {
    reviewUnresolvedSignal.mockRejectedValue(
      new ConflictError("UnresolvedSignal cannot move from RESOLVED to REVIEWED"),
    );
    const response = await POST(new Request("http://localhost/api/discovery/disc-1/review"), {
      params: Promise.resolve({ id: "disc-1" }),
    });
    expect(response.status).toBe(409);
  });
});
