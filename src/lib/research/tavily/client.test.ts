import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TAVILY_API_KEY_MISSING,
  WEB_RESEARCH_PROVIDER_ERROR,
  WebResearchError,
} from "@/lib/screening/research/types";
import {
  TAVILY_API_KEY_ENV,
  TAVILY_SEARCH_URL,
  createTavilySearchClient,
  createTavilySearchRequest,
  mapTavilyResults,
  tavilySearchApiKeyFromEnv,
} from "./client";

describe("tavilySearchApiKeyFromEnv", () => {
  const previous = process.env[TAVILY_API_KEY_ENV];

  afterEach(() => {
    if (previous == null) delete process.env[TAVILY_API_KEY_ENV];
    else process.env[TAVILY_API_KEY_ENV] = previous;
  });

  it("reads the env key when present", () => {
    process.env[TAVILY_API_KEY_ENV] = "test-key";
    expect(tavilySearchApiKeyFromEnv()).toBe("test-key");
  });

  it("returns null when the env key is missing", () => {
    delete process.env[TAVILY_API_KEY_ENV];
    expect(tavilySearchApiKeyFromEnv()).toBeNull();
  });
});

describe("createTavilySearchRequest", () => {
  it("turns a site query into include_domains without changing the company terms", () => {
    expect(createTavilySearchRequest("site:datev.de DATEV Unternehmen Produkte Dienstleistungen")).toEqual({
      query: "DATEV Unternehmen Produkte Dienstleistungen",
      include_domains: ["datev.de"],
      topic: "general",
    });
  });

  it("uses the news topic for current-development queries", () => {
    expect(createTavilySearchRequest("DATEV aktuelle News Strategie Investitionen").topic).toBe("news");
  });
});

describe("createTavilySearchClient", () => {
  it("fails clearly when the API key is missing and does not fetch", async () => {
    const fetchImpl = vi.fn();
    const client = createTavilySearchClient({ apiKey: null, fetchImpl });
    await expect(client.search("DATEV")).rejects.toMatchObject({
      name: "WebResearchError",
      code: TAVILY_API_KEY_MISSING,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps a successful Tavily response onto the internal research result", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          query: "DATEV Unternehmen",
          answer: "do-not-store-llm-answer",
          results: [
            {
              title: "DATEV",
              url: "https://www.datev.de",
              content: "Software für Steuerberater.",
              published_date: "2026-08-01",
              raw_content: "do-not-store",
              score: 0.91,
            },
          ],
          usage: { credits: 1 },
        }),
        { status: 200 },
      ),
    );
    const client = createTavilySearchClient({ apiKey: "test-key", fetchImpl });
    const results = await client.search("DATEV Unternehmen");
    expect(results).toEqual([
      {
        title: "DATEV",
        url: "https://www.datev.de",
        description: "Software für Steuerberater.",
        publishedAt: "2026-08-01T00:00:00.000Z",
        source: "datev.de",
      },
    ]);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(TAVILY_SEARCH_URL);
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body)) as { include_raw_content?: boolean; include_answer?: boolean };
    expect(body.include_raw_content).toBe(false);
    expect(body.include_answer).toBe(false);
    expect(JSON.stringify(results)).not.toContain("raw_content");
    expect(JSON.stringify(results)).not.toContain("do-not-store");
    expect(JSON.stringify(results)).not.toContain("test-key");
  });

  it("returns an empty list for an empty Tavily response", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    const client = createTavilySearchClient({ apiKey: "test-key", fetchImpl });
    await expect(client.search("DATEV")).resolves.toEqual([]);
  });

  it("maps HTTP failures to WEB_RESEARCH_PROVIDER_ERROR", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 503 }));
    const client = createTavilySearchClient({ apiKey: "test-key", fetchImpl });
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
    const client = createTavilySearchClient({
      apiKey: "test-key",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 10,
    });
    await expect(client.search("DATEV")).rejects.toMatchObject({
      code: WEB_RESEARCH_PROVIDER_ERROR,
      message: "Tavily Search timed out.",
    });
  });

  it("rejects a malformed Tavily payload", () => {
    expect(() => mapTavilyResults("not-json-object")).toThrow(/malformed response/);
    expect(() => mapTavilyResults({ results: "oops" })).toThrow(/malformed response/);
  });
});
