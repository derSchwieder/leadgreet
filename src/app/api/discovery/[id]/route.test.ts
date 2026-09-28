import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/db/serialize";

const { getUnresolvedSignalById } = vi.hoisted(() => ({
  getUnresolvedSignalById: vi.fn(),
}));

vi.mock("@/lib/db/discovery", () => ({
  getUnresolvedSignalById,
}));

import { GET } from "./route";

const item = {
  id: "disc-1",
  title: "DATEV startet AI-Agent-Projekt",
  status: "NEW",
};

describe("GET /api/discovery/:id", () => {
  beforeEach(() => {
    getUnresolvedSignalById.mockReset();
    getUnresolvedSignalById.mockResolvedValue(item);
  });

  it("returns a single discovery item", async () => {
    const response = await GET(new Request("http://localhost/api/discovery/disc-1"), {
      params: Promise.resolve({ id: "disc-1" }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(getUnresolvedSignalById).toHaveBeenCalledWith("disc-1");
    expect(body.item).toEqual(item);
  });

  it("returns 404 when the item is missing", async () => {
    getUnresolvedSignalById.mockRejectedValue(new NotFoundError("UnresolvedSignal", "missing"));
    const response = await GET(new Request("http://localhost/api/discovery/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
  });
});
