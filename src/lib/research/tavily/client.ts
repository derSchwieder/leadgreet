import {
  TAVILY_API_KEY_MISSING,
  WEB_RESEARCH_PROVIDER_ERROR,
  WebResearchError,
} from "@/lib/screening/research/types";
import type { ScreeningWebResearchResult } from "@/types";

export const TAVILY_API_KEY_ENV = "TAVILY_API_KEY";
export const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
export const TAVILY_SEARCH_TIMEOUT_MS = 8_000;

export type TavilySearchClient = {
  search(query: string): Promise<ScreeningWebResearchResult[]>;
};

type TavilyHit = {
  title?: unknown;
  url?: unknown;
  content?: unknown;
  published_date?: unknown;
};

type TavilySearchResponse = {
  results?: unknown;
  usage?: { credits?: number };
};

const SITE_PREFIX = /^site:([^\s]+)\s+(.*)$/i;

export function tavilySearchApiKeyFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const key = env[TAVILY_API_KEY_ENV]?.trim();
  return key ? key : null;
}

export function createTavilySearchRequest(query: string): {
  query: string;
  include_domains?: string[];
  topic: "general" | "news";
} {
  const site = query.match(SITE_PREFIX);
  const cleaned = (site?.[2] ?? query).trim();
  return {
    query: cleaned,
    include_domains: site?.[1] ? [site[1]] : undefined,
    topic: /\bnews\b/i.test(cleaned) ? "news" : "general",
  };
}

export function createTavilySearchClient(options?: {
  apiKey?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): TavilySearchClient {
  const apiKey = options?.apiKey === undefined ? tavilySearchApiKeyFromEnv() : options.apiKey;
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? TAVILY_SEARCH_TIMEOUT_MS;

  return {
    async search(query: string): Promise<ScreeningWebResearchResult[]> {
      if (!apiKey) {
        throw new WebResearchError(TAVILY_API_KEY_MISSING, "TAVILY_API_KEY is not configured.");
      }

      const request = createTavilySearchRequest(query);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetchImpl(TAVILY_SEARCH_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: request.query,
            search_depth: "basic",
            max_results: 8,
            include_answer: false,
            include_raw_content: false,
            include_images: false,
            include_usage: true,
            topic: request.topic,
            ...(request.include_domains ? { include_domains: request.include_domains } : {}),
          }),
          signal: controller.signal,
        });
      } catch (error) {
        if (isAbortError(error)) {
          throw new WebResearchError(WEB_RESEARCH_PROVIDER_ERROR, "Tavily Search timed out.");
        }
        throw new WebResearchError(WEB_RESEARCH_PROVIDER_ERROR, "Tavily Search is not reachable.");
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        throw new WebResearchError(
          WEB_RESEARCH_PROVIDER_ERROR,
          `Tavily Search returned HTTP ${response.status}.`,
        );
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new WebResearchError(
          WEB_RESEARCH_PROVIDER_ERROR,
          "Tavily Search returned a malformed response.",
        );
      }

      return mapTavilyResults(body);
    },
  };
}

export function mapTavilyResults(body: unknown): ScreeningWebResearchResult[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new WebResearchError(
      WEB_RESEARCH_PROVIDER_ERROR,
      "Tavily Search returned a malformed response.",
    );
  }
  const payload = body as TavilySearchResponse;
  if (payload.results != null && !Array.isArray(payload.results)) {
    throw new WebResearchError(
      WEB_RESEARCH_PROVIDER_ERROR,
      "Tavily Search returned a malformed response.",
    );
  }

  const hits = Array.isArray(payload.results) ? payload.results : [];
  const results: ScreeningWebResearchResult[] = [];
  for (const hit of hits) {
    if (!hit || typeof hit !== "object" || Array.isArray(hit)) continue;
    const item = hit as TavilyHit;
    if (typeof item.title !== "string" || !item.title.trim()) continue;
    if (typeof item.url !== "string" || !item.url.trim()) continue;
    results.push({
      title: item.title,
      url: item.url,
      description: typeof item.content === "string" ? item.content : null,
      publishedAt: readPublishedAt(item.published_date),
      source: hostnameOf(item.url),
    });
  }
  return results;
}

function readPublishedAt(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
