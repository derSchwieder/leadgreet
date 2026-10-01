import { classifyResearchSource, hostnameFromUrl } from "@/lib/research/brave/classify";
import { logWebResearch } from "@/lib/research/log";
import type { ScreeningWebResearchResult } from "@/types";
import { extractContactCandidates, extractPeopleFromText } from "./extract";
import { isLinkedInProfile } from "./sources";
import { buildContactResearchQueries } from "./queries";
import { deriveContactThemes } from "./themes";
import {
  CONTACT_RESEARCH_FAILED,
  NO_CONTACTS_NOTE,
  PUBLIC_CONTACTS_NOTE,
  type ContactResearchFinding,
  type ContactResearchInput,
  type ContactSearchFn,
} from "./types";

export async function runContactResearch(input: {
  company: ContactResearchInput;
  search: ContactSearchFn;
  provider: string;
  gapMs?: number;
  extraThemeLabels?: string[];
}): Promise<ContactResearchFinding> {
  const themes = deriveContactThemes([], [
    ...(input.company.themes ?? []),
    ...(input.extraThemeLabels ?? []),
  ]);
  const queries = buildContactResearchQueries(input.company, themes);
  const collected: ScreeningWebResearchResult[] = [];
  let providerErrors = 0;

  for (const [index, query] of queries.entries()) {
    if (index > 0 && (input.gapMs ?? 0) > 0) {
      await wait(input.gapMs ?? 0);
    }
    const started = Date.now();
    try {
      const hits = await input.search(query);
      const mapped = hits.map((hit) => ({
        ...hit,
        sourceKind: classifyResearchSource(hit.url, input.company.domain),
        source: hit.source ?? hostnameFromUrl(hit.url),
      }));
      collected.push(...mapped);
      logWebResearch({
        provider: input.provider,
        query,
        resultCount: mapped.length,
        durationMs: Date.now() - started,
        status: mapped.length > 0 ? "ok" : "empty",
      });
    } catch {
      providerErrors += 1;
      logWebResearch({
        provider: input.provider,
        query,
        resultCount: 0,
        durationMs: Date.now() - started,
        status: "error",
      });
    }
  }

  const results = uniqueResults(collected);
  const candidates = extractContactCandidates({
    company: input.company.name,
    results,
    themes,
  });
  const linkedinResultCount = results.filter((result) => isLinkedInProfile(result.url)).length;
  const linkedinCandidateCount = candidates.filter((candidate) => Boolean(candidate.profileUrl)).length;
  logWebResearch({
    provider: input.provider,
    query: "linkedin-contact-summary",
    resultCount: linkedinCandidateCount,
    durationMs: 0,
    status: linkedinCandidateCount > 0 ? "ok" : "empty",
  });
  console.info("[contact-research-linkedin]", {
    provider: input.provider,
    linkedinResultCount,
    linkedinCandidateCount,
    // Keep diagnostics bounded: enough to inspect search quality without dumping full pages.
    linkedinResults: results
      .filter((result) => isLinkedInProfile(result.url))
      .map((result) => ({
        title: result.title.slice(0, 180),
        url: result.url,
        descriptionPreview: (result.description ?? "").slice(0, 240),
        descriptionLength: (result.description ?? "").length,
        extractedMatches: extractPeopleFromText(
          `${result.title}\\n${result.description ?? ""}`,
          { company: input.company.name, sourceUrl: result.url },
        ).slice(0, 5).map((match) => ({
          name: match.name,
          role: match.role,
          pattern: match.pattern ?? null,
        })),
      })),
  });

  const limitations = [PUBLIC_CONTACTS_NOTE];
  if (providerErrors === queries.length && queries.length > 0) {
    limitations.push("Contact research provider failed; no additional people were added.");
    return {
      available: true,
      provider: input.provider,
      queries,
      results,
      candidates: [],
      limitations,
      errorCode: CONTACT_RESEARCH_FAILED,
    };
  }
  if (candidates.length === 0) {
    limitations.push(NO_CONTACTS_NOTE);
  }

  return {
    available: true,
    provider: input.provider,
    queries,
    results,
    candidates,
    limitations,
  };
}

export function emptyContactFinding(options?: {
  available?: boolean;
  provider?: string;
  limitations?: string[];
  errorCode?: string;
}): ContactResearchFinding {
  return {
    available: options?.available ?? false,
    provider: options?.provider,
    queries: [],
    results: [],
    candidates: [],
    limitations: options?.limitations ?? [PUBLIC_CONTACTS_NOTE, NO_CONTACTS_NOTE],
    errorCode: options?.errorCode,
  };
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
