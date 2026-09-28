import { UnavailableWebResearchPort } from "@/lib/screening/research/unavailable-web-researcher";
import type { WebResearchPort } from "@/lib/screening/research/types";
import { createTavilyWebResearchAdapter } from "./tavily/adapter";
import { tavilySearchApiKeyFromEnv } from "./tavily/client";

/** Composition root: Screening Engine receives only a WebResearchPort. Tavily is the active provider. */
export function createConfiguredWebResearchPort(): WebResearchPort {
  if (!tavilySearchApiKeyFromEnv()) {
    return createTavilyWebResearchAdapter({ apiKey: null, gapMs: 0 });
  }
  return createTavilyWebResearchAdapter();
}

export function createUnavailableWebResearchPort(): WebResearchPort {
  return new UnavailableWebResearchPort();
}
