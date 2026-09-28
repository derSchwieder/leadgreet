import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { getDatabaseGate, listUnresolvedSignals } = vi.hoisted(() => ({
  getDatabaseGate: vi.fn(),
  listUnresolvedSignals: vi.fn(),
}));

vi.mock("@/lib/db/status", () => ({
  getDatabaseGate,
}));

vi.mock("@/lib/db/discovery", () => ({
  listUnresolvedSignals,
}));

import DiscoveryPage from "./page";

describe("/discovery", () => {
  it("loads NEW discoveries into the inbox", async () => {
    getDatabaseGate.mockResolvedValue("ready");
    listUnresolvedSignals.mockImplementation(async (filters: { status?: string }) => {
      if (filters.status === "REVIEWED") return [];
      return [
        {
          id: "disc-1",
          title: "Neue KI-Initiative",
          description: "Siemens baut Industrial AI aus.",
          signalType: "AI_AGENT",
          source: "Presse",
          sourceUrl: null,
          detectedAt: new Date("2026-09-25T08:00:00.000Z"),
          publishedAt: null,
          companyNameRaw: "Siemens",
          personNameRaw: null,
          domainRaw: "siemens.com",
          status: "NEW",
          confidence: 87,
          resolvedCompany: null,
          resolvedContact: null,
        },
      ];
    });

    const html = renderToStaticMarkup(await DiscoveryPage());
    expect(html).toContain("Discovery");
    expect(html).toContain("Neue Entdeckungen");
    expect(html).toContain("noch keinem bestehenden Unternehmen eindeutig zugeordnet");
    expect(html).toContain("Neue KI-Initiative");
    expect(listUnresolvedSignals).toHaveBeenCalledWith({ status: "NEW", limit: 100 });
  });
});
