import type { ScreeningSource, ScreeningWebResearchResult } from "@/types";
import { runContactResearch } from "@/lib/screening/contacts";
import type { ContactResearchFinding, ContactResearchInput } from "@/lib/screening/contacts/types";
import type { NormalizedScreeningInput } from "@/lib/screening/normalize";
import {
  BRAVE_API_KEY_MISSING,
  WEB_RESEARCH_PROVIDER_ERROR,
  WebResearchError,
  type CompanyResearchFinding,
  type SignalResearchFinding,
  type WebResearchPort,
} from "@/lib/screening/research/types";
import { logWebResearch } from "../log";
import { classifyResearchSource, hostnameFromUrl } from "./classify";
import {
  braveSearchApiKeyFromEnv,
  createBraveSearchClient,
  type BraveSearchClient,
} from "./client";
import { buildCompanyResearchQueries } from "./queries";

export const BRAVE_PROVIDER = "brave";

export class BraveWebResearchAdapter implements WebResearchPort {
  readonly provider = BRAVE_PROVIDER;
  readonly available: boolean;
  readonly unavailableCode?: string;
  private readonly client: BraveSearchClient;
  private readonly gapMs: number;
  private readonly officialDomain: string | null | undefined;

  constructor(options?: {
    apiKey?: string | null;
    client?: BraveSearchClient;
    gapMs?: number;
    officialDomain?: string | null;
  }) {
    const apiKey = options?.apiKey === undefined ? braveSearchApiKeyFromEnv() : options.apiKey;
    this.available = Boolean(apiKey) || Boolean(options?.client);
    this.unavailableCode = this.available ? undefined : BRAVE_API_KEY_MISSING;
    this.client = options?.client ?? createBraveSearchClient({ apiKey });
    this.gapMs = options?.gapMs ?? 1_100;
    this.officialDomain = options?.officialDomain;
  }

  async researchCompany(input: NormalizedScreeningInput): Promise<CompanyResearchFinding> {
    if (!this.available) {
      throw new WebResearchError(BRAVE_API_KEY_MISSING, "BRAVE_SEARCH_API_KEY is not configured.");
    }

    const queries = buildCompanyResearchQueries(input);
    const officialDomain = this.officialDomain ?? input.domain;
    const collected: ScreeningWebResearchResult[] = [];
    let providerErrors = 0;

    for (const [index, query] of queries.entries()) {
      if (index > 0 && this.gapMs > 0) {
        await wait(this.gapMs);
      }
      const started = Date.now();
      try {
        const hits = await this.client.search(query);
        const mapped = hits.map((hit) => ({
          ...hit,
          sourceKind: classifyResearchSource(hit.url, officialDomain),
          source: hit.source ?? hostnameFromUrl(hit.url),
        }));
        collected.push(...mapped);
        logWebResearch({
          provider: BRAVE_PROVIDER,
          query,
          resultCount: mapped.length,
          durationMs: Date.now() - started,
          status: mapped.length > 0 ? "ok" : "empty",
        });
      } catch (error) {
        providerErrors += 1;
        logWebResearch({
          provider: BRAVE_PROVIDER,
          query,
          resultCount: 0,
          durationMs: Date.now() - started,
          status: isTimeout(error) ? "timeout" : "error",
        });
        if (error instanceof WebResearchError && error.code === BRAVE_API_KEY_MISSING) {
          throw error;
        }
      }
    }

    const results = uniqueResults(collected);
    if (results.length === 0 && providerErrors === queries.length) {
      throw new WebResearchError(
        WEB_RESEARCH_PROVIDER_ERROR,
        "Brave Search did not return any usable response.",
      );
    }

    return {
      profile: {},
      companyId: null,
      available: true,
      research: {
        provider: BRAVE_PROVIDER,
        queries,
        results,
      },
      sources: resultsToSources(results),
    };
  }

  async researchSignals(_input: NormalizedScreeningInput): Promise<SignalResearchFinding> {
    return { signals: [], sources: [] };
  }

  async researchContacts(input: ContactResearchInput): Promise<ContactResearchFinding> {
    if (!this.available) {
      throw new WebResearchError(BRAVE_API_KEY_MISSING, "BRAVE_SEARCH_API_KEY is not configured.");
    }
    return runContactResearch({
      company: input,
      provider: BRAVE_PROVIDER,
      gapMs: this.gapMs,
      extraThemeLabels: input.themes,
      search: async (query) => {
        const hits = await this.client.search(query);
        return hits.map((hit) => ({
          ...hit,
          sourceKind: classifyResearchSource(hit.url, this.officialDomain ?? input.domain),
          source: hit.source ?? hostnameFromUrl(hit.url),
        }));
      },
    });
  }
}

function uniqueResults(results: ScreeningWebResearchResult[]): ScreeningWebResearchResult[] {
  const seen = new Set<string>();
  const unique: ScreeningWebResearchResult[] = [];
  for (const result of results) {
    if (seen.has(result.url)) continue;
    seen.add(result.url);
    unique.push(result);
  }
  return unique;
}

function resultsToSources(results: ScreeningWebResearchResult[]): ScreeningSource[] {
  return results.map((result) => ({
    title: result.title,
    url: result.url,
    publisher: result.source ?? null,
    publishedAt: result.publishedAt ?? null,
  }));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && /timed out/i.test(error.message);
}

export function createBraveWebResearchAdapter(options?: {
  apiKey?: string | null;
  client?: BraveSearchClient;
  gapMs?: number;
}): BraveWebResearchAdapter {
  return new BraveWebResearchAdapter(options);
}
