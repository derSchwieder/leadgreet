import { AnalysisError, LLM_API_KEY_MISSING } from "./errors";
import { createOpenAiAnalysisAdapter } from "./openai-adapter";
import { llmApiKeyFromEnv } from "./openai-client";
import type { AnalysisPort, ScreeningAnalysis, ScreeningAnalysisInput } from "./types";

export class UnavailableAnalysisPort implements AnalysisPort {
  readonly available = false;
  readonly provider = "none";
  readonly unavailableCode = LLM_API_KEY_MISSING;

  async analyze(_input: ScreeningAnalysisInput): Promise<ScreeningAnalysis> {
    throw new AnalysisError(LLM_API_KEY_MISSING, "LLM_API_KEY is not configured.");
  }
}

export function createConfiguredAnalysisPort(): AnalysisPort {
  if (!llmApiKeyFromEnv()) {
    return new UnavailableAnalysisPort();
  }
  return createOpenAiAnalysisAdapter();
}
