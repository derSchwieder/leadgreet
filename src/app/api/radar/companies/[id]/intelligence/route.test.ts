import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentAccountId, getCompanyIntelligence } = vi.hoisted(() => ({
  getCurrentAccountId: vi.fn(),
  getCompanyIntelligence: vi.fn(),
}));

vi.mock("@/lib/db/accounts", () => ({
  getCurrentAccountId,
}));

vi.mock("@/lib/db/intelligence", () => ({
  getCompanyIntelligence,
}));

import { GET } from "./route";

describe("GET /api/radar/companies/[id]/intelligence", () => {
  beforeEach(() => {
    getCurrentAccountId.mockReset();
    getCompanyIntelligence.mockReset();
    getCurrentAccountId.mockResolvedValue("account-demo");
    getCompanyIntelligence.mockResolvedValue({
      accountId: "account-demo",
      company: { id: "co-1", name: "VIA optronics", industry: null, companySize: null },
      triggerSignal: { id: "sig-1", type: "HIRING", title: "AI hiring", signalStrength: 80, detectedAt: new Date("2026-01-01") },
      primaryService: null,
      businessCases: [],
      primaryBusinessCase: null,
      matchingContact: null,
      recommendedContent: null,
      recentActivities: [],
      nextStep: "PREPARE_OUTREACH",
      nextStepReason: "Kontaktaufnahme vorbereiten.",
    });
  });

  it("loads intelligence for the current account and ignores a client account override", async () => {
    const request = new Request(
      "http://localhost/api/radar/companies/co-1/intelligence?accountId=account-other",
    );
    const response = await GET(request, { params: Promise.resolve({ id: "co-1" }) });
    const body = await response.json();

    expect(getCurrentAccountId).toHaveBeenCalledOnce();
    expect(getCompanyIntelligence).toHaveBeenCalledWith("co-1", "account-demo");
    expect(getCompanyIntelligence).not.toHaveBeenCalledWith("co-1", "account-other");
    expect(body.intelligence.company.id).toBe("co-1");
    expect(body.intelligence.nextStep).toBe("PREPARE_OUTREACH");
    expect(JSON.stringify(body)).not.toContain("account-demo");
    expect(body.intelligence).not.toHaveProperty("accountId");
  });
});
