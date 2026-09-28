import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/lib/db/serialize";

const { getCurrentAccountId, runQueuedCompanyScreening } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  runQueuedCompanyScreening: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/screening", () => ({
  runQueuedCompanyScreening,
}));

import { POST } from "./route";

describe("POST /api/screenings/:id/run", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    runQueuedCompanyScreening.mockReset();
    getCurrentAccountId.mockResolvedValue("account-a");
  });

  it("runs a queued screening for the current account", async () => {
    runQueuedCompanyScreening.mockResolvedValue({
      id: "scr-1",
      status: "COMPLETED",
      result: { companyProfile: { companyName: "DATEV eG" }, sources: [] },
    });
    const response = await POST(new Request("http://localhost/api/screenings/scr-1/run"), {
      params: Promise.resolve({ id: "scr-1" }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(runQueuedCompanyScreening).toHaveBeenCalledWith("account-a", "scr-1");
    expect(body.screening.status).toBe("COMPLETED");
  });

  it("returns 409 when the screening is already running or completed", async () => {
    runQueuedCompanyScreening.mockRejectedValue(
      new ConflictError("CompanyScreening is already RUNNING"),
    );
    const response = await POST(new Request("http://localhost/api/screenings/scr-1/run"), {
      params: Promise.resolve({ id: "scr-1" }),
    });
    expect(response.status).toBe(409);
  });

  it("returns 404 when the screening is missing", async () => {
    runQueuedCompanyScreening.mockRejectedValue(new NotFoundError("CompanyScreening", "missing"));
    const response = await POST(new Request("http://localhost/api/screenings/missing/run"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
  });
});
