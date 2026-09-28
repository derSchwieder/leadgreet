import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BRAVE_API_KEY_MISSING,
  WEB_RESEARCH_PROVIDER_ERROR,
  WebResearchError,
} from "@/lib/screening/research/types";
import {
  BRAVE_SEARCH_API_KEY_ENV,
  BRAVE_WEB_SEARCH_URL,
  braveSearchApiKeyFromEnv,
  createBraveSearchClient,
} from "./client";

describe("braveSearchApiKeyFromEnv", () => {
  const previous = process.env[BRAVE_SEARCH_API_KEY_ENV];

  afterEach(() => {
    if (previous == null) delete process.env[BRAVE_SEARCH_API_KEY_ENV];
    else process.env[BRAVE_SEARCH_API_KEY_ENV] = previous;
  });

  it("reads the env key when present", () => {
    process.env[BRAVE_SEARCH_API_KEY_ENV] = "test-key";
    expect(braveSearchApiKeyFromEnv()).toBe("test-key");
  });

  it("returns null when the env key is missing", () => {
    delete process.env[BRAVE_SEARCH_API_KEY_ENV];
    expect(braveSearchApiKeyFromEnv()).toBeNull();
  });
});

describe("createBraveSearchClient", () => {
  it("fails clearly when the API key is missing and does not fetch", async () => {
    const fetchImpl = vi.fn();
    const client = createBraveSearchClient({ apiKey: null, fetchImpl });
    await expect(client.search("DATEV")).rejects.toMatchObject({
      name: "WebResearchError",
      code: BRAVE_API_KEY_MISSING,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps a successful Brave response without keeping the raw payload", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          web: {
            results: [
              {
                title: "DATEV",
                url: "https://www.datev.de",
                description: "Software für Steuerberater.",
                page_age: "2026-08-01T00:00:00Z",
                meta_url: { hostname: "www.datev.de" },
                extra_snippets: ["do-not-store"],
              },
            ],
          },
        }),
        { status: 200 },
      ),
    );
    const client = createBraveSearchClient({ apiKey: "test-key", fetchImpl });
    const results = await client.search("DATEV Unternehmen");
    expect(results).toEqual([
      {
        title: "DATEV",
        url: "https://www.datev.de",
        description: "Software für Steuerberater.",
        publishedAt: "2026-08-01T00:00:00.000Z",
        source: "www.datev.de",
      },
    ]);
    const request = fetchImpl.mock.calls[0]?.[0];
    expect(String(request)).toContain(BRAVE_WEB_SEARCH_URL);
    expect(JSON.stringify(results)).not.toContain("extra_snippets");
    expect(JSON.stringify(results)).not.toContain("test-key");
  });

  it("returns an empty list for an empty Brave response", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ web: { results: [] } }), { status: 200 }));
    const client = createBraveSearchClient({ apiKey: "test-key", fetchImpl });
    await expect(client.search("DATEV")).resolves.toEqual([]);
  });

  it("maps HTTP failures to WEB_RESEARCH_PROVIDER_ERROR", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 503 }));
    const client = createBraveSearchClient({ apiKey: "test-key", fetchImpl });
    await expect(client.search("DATEV")).rejects.toBeInstanceOf(WebResearchError);
    await expect(client.search("DATEV")).rejects.toMatchObject({
      code: WEB_RESEARCH_PROVIDER_ERROR,
    });
  });

  it("maps a timeout to WEB_RESEARCH_PROVIDER_ERROR", async () => {
    const fetchImpl = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    });
    const client = createBraveSearchClient({
      apiKey: "test-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 10,
    });
    await expect(client.search("DATEV")).rejects.toMatchObject({
      code: WEB_RESEARCH_PROVIDER_ERROR,
      message: "Brave Search timed out.",
    });
  });
});
