import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/lib/db/serialize";

const { resolveUnresolvedSignal } = vi.hoisted(() => ({
  resolveUnresolvedSignal: vi.fn(),
}));

vi.mock("@/lib/db/discovery", () => ({
  resolveUnresolvedSignal,
}));

import { POST } from "./route";

function post(id: string, body: unknown) {
  return POST(
    new Request(`http://localhost/api/discovery/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("POST /api/discovery/:id/resolve", () => {
  beforeEach(() => {
    resolveUnresolvedSignal.mockReset();
    resolveUnresolvedSignal.mockResolvedValue({
      id: "disc-1",
      status: "RESOLVED",
      resolvedCompany: { id: "co-1", name: "DATEV" },
    });
  });

  it("matches an existing company", async () => {
    const response = await post("disc-1", { companyId: "co-1" });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(resolveUnresolvedSignal).toHaveBeenCalledWith("disc-1", { companyId: "co-1" });
    expect(body.item.status).toBe("RESOLVED");
  });

  it("creates a new company from supported fields", async () => {
    const response = await post("disc-1", {
      createCompany: { name: "DATEV", website: "https://www.datev.de" },
    });
    expect(response.status).toBe(200);
    expect(resolveUnresolvedSignal).toHaveBeenCalledWith("disc-1", {
      createCompany: expect.objectContaining({
        name: "DATEV",
        website: "https://www.datev.de",
      }),
    });
  });

  it("rejects a second resolve", async () => {
    resolveUnresolvedSignal.mockRejectedValue(
      new ConflictError("UnresolvedSignal is already RESOLVED"),
    );
    const response = await post("disc-1", { companyId: "co-1" });
    expect(response.status).toBe(409);
  });

  it("returns 404 for an unknown company", async () => {
    resolveUnresolvedSignal.mockRejectedValue(new NotFoundError("Company", "missing-co"));
    const response = await post("disc-1", { companyId: "missing-co" });
    expect(response.status).toBe(404);
  });

  it("returns 404 for a missing discovery item", async () => {
    resolveUnresolvedSignal.mockRejectedValue(new NotFoundError("UnresolvedSignal", "missing"));
    const response = await post("missing", { companyId: "co-1" });
    expect(response.status).toBe(404);
  });

  it("rejects a request without companyId or createCompany", async () => {
    const response = await post("disc-1", {});
    expect(response.status).toBe(400);
    expect(resolveUnresolvedSignal).not.toHaveBeenCalled();
  });
});
