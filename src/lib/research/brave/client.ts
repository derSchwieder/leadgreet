import {
  BRAVE_API_KEY_MISSING,
  WEB_RESEARCH_PROVIDER_ERROR,
  WebResearchError,
} from "@/lib/screening/research/types";
import type { ScreeningWebResearchResult } from "@/types";

export const BRAVE_SEARCH_API_KEY_ENV = "BRAVE_SEARCH_API_KEY";
export const BRAVE_WEB_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";
export const BRAVE_SEARCH_TIMEOUT_MS = 8_000;

export type BraveSearchClient = {
  search(query: string): Promise<ScreeningWebResearchResult[]>;
};

type BraveWebHit = {
  title?: string;
  url?: string;
  description?: string;
  page_age?: string;
  age?: string;
  meta_url?: { hostname?: string };
};

type BraveWebSearchResponse = {
  web?: { results?: BraveWebHit[] };
};

export function braveSearchApiKeyFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const key = env[BRAVE_SEARCH_API_KEY_ENV]?.trim();
  return key ? key : null;
}

export function createBraveSearchClient(options?: {
  apiKey?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): BraveSearchClient {
  const apiKey = options?.apiKey === undefined ? braveSearchApiKeyFromEnv() : options.apiKey;
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? BRAVE_SEARCH_TIMEOUT_MS;

  return {
    async search(query: string): Promise<ScreeningWebResearchResult[]> {
      if (!apiKey) {
        throw new WebResearchError(
          BRAVE_API_KEY_MISSING,
          "BRAVE_SEARCH_API_KEY is not configured.",
        );
      }

      const url = new URL(BRAVE_WEB_SEARCH_URL);
      url.searchParams.set("q", query);
      url.searchParams.set("count", "8");
      url.searchParams.set("country", "DE");
      url.searchParams.set("search_lang", "de");

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Subscription-Token": apiKey,
          },
          signal: controller.signal,
        });
      } catch (error) {
        if (isAbortError(error)) {
          throw new WebResearchError(WEB_RESEARCH_PROVIDER_ERROR, "Brave Search timed out.");
        }
        throw new WebResearchError(WEB_RESEARCH_PROVIDER_ERROR, "Brave Search is not reachable.");
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        throw new WebResearchError(
          WEB_RESEARCH_PROVIDER_ERROR,
          `Brave Search returned HTTP ${response.status}.`,
        );
      }

      const body = (await response.json()) as BraveWebSearchResponse;
      return mapBraveResults(body);
    },
  };
}

function mapBraveResults(body: BraveWebSearchResponse): ScreeningWebResearchResult[] {
  const hits = body.web?.results ?? [];
  const results: ScreeningWebResearchResult[] = [];
  for (const hit of hits) {
    if (!hit.title || !hit.url) continue;
    results.push({
      title: hit.title,
      url: hit.url,
      description: hit.description ?? null,
      publishedAt: readPublishedAt(hit.page_age) ?? readPublishedAt(hit.age),
      source: hit.meta_url?.hostname ?? hostnameOf(hit.url),
    });
  }
  return results;
}

function readPublishedAt(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
