import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/db/serialize";

const { getCurrentAccountId, getCompanyScreeningById } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  getCompanyScreeningById: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/screenings", () => ({
  getCompanyScreeningById,
}));

import { GET } from "./route";

const screening = {
  id: "scr-1",
  status: "QUEUED",
  inputName: "DATEV",
  inputDomain: "datev.de",
  companyId: null,
  company: null,
  startedAt: "2026-09-25T08:00:00.000Z",
  completedAt: null,
  result: null,
};

describe("GET /api/screenings/:id", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    getCompanyScreeningById.mockReset();
    getCurrentAccountId.mockResolvedValue("account-a");
    getCompanyScreeningById.mockResolvedValue(screening);
  });

  it("returns a queued screening without pretending research finished", async () => {
    const response = await GET(new Request("http://localhost/api/screenings/scr-1"), {
      params: Promise.resolve({ id: "scr-1" }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(getCompanyScreeningById).toHaveBeenCalledWith("account-a", "scr-1");
    expect(body.screening.status).toBe("QUEUED");
    expect(body.screening.company).toBeNull();
    expect(body.screening.result).toBeNull();
    expect(body.screening.completedAt).toBeNull();
  });

  it("returns 404 when the screening is missing", async () => {
    getCompanyScreeningById.mockRejectedValue(new NotFoundError("CompanyScreening", "missing"));
    const response = await GET(new Request("http://localhost/api/screenings/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(response.status).toBe(404);
  });
});
