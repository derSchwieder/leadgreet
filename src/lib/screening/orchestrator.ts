import {
  AnalysisError,
  createConfiguredAnalysisPort,
  LLM_API_KEY_MISSING,
  LLM_PROVIDER_ERROR,
  type AnalysisPort,
} from "@/lib/analysis";
import { createConfiguredWebResearchPort } from "@/lib/research/web-port";
import {
  claimCompanyScreeningRun,
  completeCompanyScreening,
  failCompanyScreening,
  getCompanyScreeningById,
  type ScreeningView,
} from "@/lib/db/screenings";
import type { ScreeningSource, ScreeningWebResearch, ScreeningWebResearchResult } from "@/types";
import { AccountIcpSource } from "./icp/account-source";
import { UnavailableSalesIntelligenceAnalyzer } from "./intelligence/unavailable-sales-analyzer";
import { normalizeScreeningInput, type NormalizedScreeningInput } from "./normalize";
import { researchLocalCompany } from "./research/local-company-researcher";
import { PrismaCompanyCatalog } from "./research/prisma-company-catalog";
import {
  BRAVE_API_KEY_MISSING,
  TAVILY_API_KEY_MISSING,
  WEB_RESEARCH_NO_RESULTS,
  WEB_RESEARCH_PROVIDER_ERROR,
  WEB_RESEARCH_UNAVAILABLE,
  WebResearchError,
  type CompanyCatalogPort,
  type CompanyResearchFinding,
  type IcpSourcePort,
  type SalesIntelligencePort,
  type ScreeningRunOutcome,
  type WebResearchPort,
} from "./research/types";
import {
  CONTACT_RESEARCH_FAILED,
  deriveContactThemes,
  emptyContactFinding,
  NO_CONTACTS_NOTE,
  PUBLIC_CONTACTS_NOTE,
  type ContactResearchFinding,
} from "./contacts";
import { uniqueSources } from "./result-builder";

export type ScreeningEnginePorts = {
  catalog: CompanyCatalogPort;
  web: WebResearchPort;
  icp: IcpSourcePort;
  sales: SalesIntelligencePort;
  analysis: AnalysisPort;
  now?: Date;
};

export function createDefaultScreeningPorts(): ScreeningEnginePorts {
  return {
    catalog: new PrismaCompanyCatalog(),
    web: createConfiguredWebResearchPort(),
    icp: new AccountIcpSource(),
    sales: new UnavailableSalesIntelligenceAnalyzer(),
    analysis: createConfiguredAnalysisPort(),
  };
}

export async function executeScreeningPipeline(
  ports: ScreeningEnginePorts,
  input: { accountId: string; name: string; domain?: string | null },
): Promise<ScreeningRunOutcome> {
  const normalized = normalizeScreeningInput({
    name: input.name,
    domain: input.domain,
  });

  if (!ports.web.available) {
    const code = ports.web.unavailableCode ?? WEB_RESEARCH_UNAVAILABLE;
    return {
      status: "FAILED",
      code,
      message: missingProviderMessage(code),
    };
  }

  let finding: CompanyResearchFinding;
  try {
    finding = await ports.web.researchCompany(normalized);
  } catch (error) {
    if (error instanceof WebResearchError) {
      return { status: "FAILED", code: error.code, message: error.message };
    }
    return {
      status: "FAILED",
      code: WEB_RESEARCH_PROVIDER_ERROR,
      message: "Web research provider failed.",
    };
  }

  const research = researchFromFinding(finding, ports.web.provider ?? "web");
  if (research.results.length === 0) {
    return {
      status: "FAILED",
      code: WEB_RESEARCH_NO_RESULTS,
      message: "Web research returned no usable public results.",
    };
  }

  const local = await researchLocalCompany(ports.catalog, normalized);
  const icp = await ports.icp.getProfile(input.accountId);
  const contactResearch = await safeContactResearch(ports.web, normalized, research.results);

  if (!ports.analysis.available) {
    return {
      status: "FAILED",
      code: ports.analysis.unavailableCode ?? LLM_API_KEY_MISSING,
      message: "LLM_API_KEY is not configured.",
    };
  }

  try {
    const analysis = await ports.analysis.analyze({
      company: {
        id: local.companyId ?? finding.companyId ?? undefined,
        name: normalized.name,
        domain: normalized.domain ?? undefined,
      },
      research: {
        queries: research.queries,
        results: research.results,
      },
      contacts: {
        queries: contactResearch.queries,
        results: contactResearch.results,
        candidates: contactResearch.candidates,
      },
      icp,
    });

    const limitations = uniqueLimitations([
      ...analysis.limitations,
      ...contactResearch.limitations,
    ]);
    if (analysis.relevantContacts.length === 0 && !limitations.includes(NO_CONTACTS_NOTE)) {
      limitations.push(NO_CONTACTS_NOTE);
    }

    return {
      status: "COMPLETED",
      companyId: local.companyId ?? finding.companyId,
      payload: {
        research,
        contactResearch: {
          provider: contactResearch.provider,
          queries: contactResearch.queries,
          results: contactResearch.results,
          candidates: contactResearch.candidates,
          limitations: contactResearch.limitations,
        },
        analysis: { ...analysis, limitations },
        sources: uniqueSources([
          ...researchToSources(research.results),
          ...researchToSources(contactResearch.results),
          ...finding.sources,
        ]),
        coverage: "web",
        limitations,
      },
    };
  } catch (error) {
    if (error instanceof AnalysisError) {
      return { status: "FAILED", code: error.code, message: error.message };
    }
    return {
      status: "FAILED",
      code: LLM_PROVIDER_ERROR,
      message: "LLM analysis failed.",
    };
  }
}

export async function runQueuedCompanyScreening(
  accountId: string,
  screeningId: string,
  ports: ScreeningEnginePorts = createDefaultScreeningPorts(),
): Promise<ScreeningView> {
  await claimCompanyScreeningRun(accountId, screeningId);
  const screening = await getCompanyScreeningById(accountId, screeningId);

  try {
    const outcome = await executeScreeningPipeline(ports, {
      accountId,
      name: screening.inputName,
      domain: screening.inputDomain,
    });

    if (outcome.status === "FAILED") {
      return failCompanyScreening(accountId, screeningId, {
        code: outcome.code,
        message: outcome.message,
      });
    }

    return completeCompanyScreening(accountId, screeningId, {
      companyId: outcome.companyId,
      payload: outcome.payload,
    });
  } catch (error) {
    await failCompanyScreening(accountId, screeningId).catch(() => undefined);
    throw error;
  }
}

function researchFromFinding(
  finding: CompanyResearchFinding,
  provider: string,
): ScreeningWebResearch {
  if (finding.research?.results.length) {
    return finding.research;
  }
  const results: ScreeningWebResearchResult[] = finding.sources.flatMap((source) => {
    if (!source.url) return [];
    return [
      {
        title: source.title,
        url: source.url,
        description: null,
        publishedAt: source.publishedAt,
        source: source.publisher,
      },
    ];
  });
  return {
    provider: finding.research?.provider ?? provider,
    queries: finding.research?.queries ?? [],
    results,
  };
}

async function safeContactResearch(
  web: WebResearchPort,
  input: NormalizedScreeningInput,
  companyResults: ScreeningWebResearchResult[],
): Promise<ContactResearchFinding> {
  try {
    return await web.researchContacts({
      ...input,
      themes: deriveContactThemes(companyResults).map((theme) => theme.label),
    });
  } catch {
    return emptyContactFinding({
      available: web.available,
      provider: web.provider,
      errorCode: CONTACT_RESEARCH_FAILED,
      limitations: [
        PUBLIC_CONTACTS_NOTE,
        "Contact research provider failed; no additional people were added.",
      ],
    });
  }
}

function uniqueLimitations(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function missingProviderMessage(code: string): string {
  if (code === TAVILY_API_KEY_MISSING) return "TAVILY_API_KEY is not configured.";
  if (code === BRAVE_API_KEY_MISSING) return "BRAVE_SEARCH_API_KEY is not configured.";
  return "No public-web research provider is configured.";
}

function researchToSources(results: ScreeningWebResearchResult[]): ScreeningSource[] {
  return results.map((result) => ({
    title: result.title,
    url: result.url,
    publisher: result.source ?? null,
    publishedAt: result.publishedAt ?? null,
  }));
}
