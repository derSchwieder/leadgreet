import { logWebResearch } from "@/lib/research/log";
import { AnalysisError, LLM_API_KEY_MISSING } from "./errors";
import { sanitizeScreeningAnalysis } from "./evidence";
import { createOpenAiCompletionClient, llmApiKeyFromEnv, type LlmCompletionClient } from "./openai-client";
import { buildScreeningAnalysisUserPrompt, SCREENING_ANALYSIS_SYSTEM_PROMPT } from "./prompts";
import type { AnalysisPort, ScreeningAnalysis, ScreeningAnalysisInput } from "./types";

export const OPENAI_ANALYSIS_PROVIDER = "openai";

export class OpenAiAnalysisAdapter implements AnalysisPort {
  readonly provider = OPENAI_ANALYSIS_PROVIDER;
  readonly available: boolean;
  readonly unavailableCode?: string;
  private readonly client: LlmCompletionClient;

  constructor(options?: { apiKey?: string | null; client?: LlmCompletionClient }) {
    const apiKey = options?.apiKey === undefined ? llmApiKeyFromEnv() : options.apiKey;
    this.available = Boolean(apiKey) || Boolean(options?.client);
    this.unavailableCode = this.available ? undefined : LLM_API_KEY_MISSING;
    this.client = options?.client ?? createOpenAiCompletionClient({ apiKey });
  }

  async analyze(input: ScreeningAnalysisInput): Promise<ScreeningAnalysis> {
    if (!this.available) {
      throw new AnalysisError(LLM_API_KEY_MISSING, "LLM_API_KEY is not configured.");
    }
    const started = Date.now();
    try {
      const raw = await this.client.completeJson({
        system: SCREENING_ANALYSIS_SYSTEM_PROMPT,
        user: buildScreeningAnalysisUserPrompt(input),
      });
      const analysis = sanitizeScreeningAnalysis(raw, input.research.results, {
        contacts: input.contacts,
      });
      logWebResearch({
        provider: OPENAI_ANALYSIS_PROVIDER,
        query: `analyze:${input.company.name}`,
        resultCount: analysis.signals.length + analysis.salesHypotheses.length,
        durationMs: Date.now() - started,
        status: "ok",
      });
      return analysis;
    } catch (error) {
      logWebResearch({
        provider: OPENAI_ANALYSIS_PROVIDER,
        query: `analyze:${input.company.name}`,
        resultCount: 0,
        durationMs: Date.now() - started,
        status: "error",
      });
      throw error;
    }
  }
}

export function createOpenAiAnalysisAdapter(options?: {
  apiKey?: string | null;
  client?: LlmCompletionClient;
}): OpenAiAnalysisAdapter {
  return new OpenAiAnalysisAdapter(options);
}
