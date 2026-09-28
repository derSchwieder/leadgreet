import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dismissDiscoveryItem,
  fetchDiscoveryList,
  resolveDiscoveryItem,
  reviewDiscoveryItem,
} from "./discovery-api";

const item = {
  id: "disc-1",
  title: "Neue KI-Initiative",
  description: null,
  signalType: "AI_AGENT",
  source: "Presse",
  sourceUrl: null,
  detectedAt: "2026-09-25T08:00:00.000Z",
  publishedAt: null,
  companyNameRaw: "Siemens",
  personNameRaw: null,
  domainRaw: "siemens.com",
  status: "NEW",
  confidence: 87,
  resolvedCompany: null,
  resolvedContact: null,
};

describe("discovery api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the NEW inbox", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [item] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const items = await fetchDiscoveryList({ status: "NEW" });
    expect(fetchMock).toHaveBeenCalledWith("/api/discovery?status=NEW&limit=100");
    expect(items[0]?.title).toBe("Neue KI-Initiative");
  });

  it("reviews, dismisses and resolves through the existing endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ item: { ...item, status: "REVIEWED" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ item: { ...item, status: "DISMISSED" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          item: {
            ...item,
            status: "RESOLVED",
            resolvedCompany: { id: "co-1", name: "Siemens" },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          item: {
            ...item,
            status: "RESOLVED",
            resolvedCompany: { id: "co-2", name: "DATEV" },
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(reviewDiscoveryItem("disc-1")).resolves.toMatchObject({ status: "REVIEWED" });
    await expect(dismissDiscoveryItem("disc-1")).resolves.toMatchObject({ status: "DISMISSED" });
    await expect(resolveDiscoveryItem("disc-1", { companyId: "co-1" })).resolves.toMatchObject({
      status: "RESOLVED",
    });
    await expect(
      resolveDiscoveryItem("disc-1", { createCompany: { name: "DATEV", website: "https://datev.de" } }),
    ).resolves.toMatchObject({ resolvedCompany: { name: "DATEV" } });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/discovery/disc-1/review");
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ companyId: "co-1" }),
    });
    expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
      body: JSON.stringify({ createCompany: { name: "DATEV", website: "https://datev.de" } }),
    });
  });

  it("surfaces API errors without a stack trace", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "UnresolvedSignal is already RESOLVED" }),
      }),
    );
    await expect(reviewDiscoveryItem("disc-1")).rejects.toThrow(
      "Dieser Schritt ist in diesem Status nicht möglich.",
    );
  });
});
