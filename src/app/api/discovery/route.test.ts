import { beforeEach, describe, expect, it, vi } from "vitest";

const { listUnresolvedSignals } = vi.hoisted(() => ({
  listUnresolvedSignals: vi.fn(),
}));

vi.mock("@/lib/db/discovery", () => ({
  listUnresolvedSignals,
}));

import { GET } from "./route";

const item = {
  id: "disc-1",
  title: "DATEV startet AI-Agent-Projekt",
  description: "Pilot",
  signalType: "AI_AGENT",
  source: "press",
  sourceUrl: "https://example.com/datev",
  detectedAt: "2026-09-20T00:00:00.000Z",
  publishedAt: null,
  companyNameRaw: "DATEV",
  personNameRaw: null,
  domainRaw: "datev.de",
  status: "NEW",
  confidence: 70,
  resolvedCompany: null,
  resolvedContact: null,
};

describe("GET /api/discovery", () => {
  beforeEach(() => {
    listUnresolvedSignals.mockReset();
    listUnresolvedSignals.mockResolvedValue([item]);
  });

  it("lists inbox items newest first via the db helper", async () => {
    const response = await GET(new Request("http://localhost/api/discovery"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(listUnresolvedSignals).toHaveBeenCalledWith({
      status: undefined,
      signalType: undefined,
      limit: 50,
    });
    expect(body.items).toEqual([item]);
  });

  it("filters by status", async () => {
    const response = await GET(new Request("http://localhost/api/discovery?status=REVIEWED"));
    expect(response.status).toBe(200);
    expect(listUnresolvedSignals).toHaveBeenCalledWith({
      status: "REVIEWED",
      signalType: undefined,
      limit: 50,
    });
  });

  it("rejects an invalid status", async () => {
    const response = await GET(new Request("http://localhost/api/discovery?status=HOT"));
    expect(response.status).toBe(400);
    expect(listUnresolvedSignals).not.toHaveBeenCalled();
  });
});
