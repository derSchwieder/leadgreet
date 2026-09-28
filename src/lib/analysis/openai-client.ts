import { AnalysisError, LLM_API_KEY_MISSING, LLM_INVALID_OUTPUT, LLM_PROVIDER_ERROR } from "./errors";
import { OPENAI_SCREENING_ANALYSIS_SCHEMA, parseScreeningAnalysis } from "./schema";
import type { ScreeningAnalysis } from "./types";

export const LLM_API_KEY_ENV = "LLM_API_KEY";
export const LLM_MODEL_ENV = "LLM_MODEL";
export const DEFAULT_LLM_MODEL = "gpt-4o-mini";
export const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
export const LLM_TIMEOUT_MS = 45_000;

type EnvRecord = Record<string, string | undefined>;

export function llmApiKeyFromEnv(env: EnvRecord = process.env): string | null {
  const key = env[LLM_API_KEY_ENV]?.trim();
  return key ? key : null;
}

export function llmModelFromEnv(env: EnvRecord = process.env): string {
  return env[LLM_MODEL_ENV]?.trim() || DEFAULT_LLM_MODEL;
}

export type LlmCompletionClient = {
  completeJson(input: { system: string; user: string }): Promise<ScreeningAnalysis>;
};

export function createOpenAiCompletionClient(options?: {
  apiKey?: string | null;
  model?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): LlmCompletionClient {
  const apiKey = options?.apiKey === undefined ? llmApiKeyFromEnv() : options.apiKey;
  const model = options?.model ?? llmModelFromEnv();
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? LLM_TIMEOUT_MS;

  return {
    async completeJson(input) {
      if (!apiKey) {
        throw new AnalysisError(LLM_API_KEY_MISSING, "LLM_API_KEY is not configured.");
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetchImpl(OPENAI_CHAT_COMPLETIONS_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "screening_analysis",
                strict: true,
                schema: OPENAI_SCREENING_ANALYSIS_SCHEMA,
              },
            },
            messages: [
              { role: "system", content: input.system },
              { role: "user", content: input.user },
            ],
          }),
          signal: controller.signal,
        });
      } catch (error) {
        if (isAbortError(error)) {
          throw new AnalysisError(LLM_PROVIDER_ERROR, "LLM provider timed out.");
        }
        throw new AnalysisError(LLM_PROVIDER_ERROR, "LLM provider is not reachable.");
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        throw new AnalysisError(
          LLM_PROVIDER_ERROR,
          `LLM provider returned HTTP ${response.status}.`,
        );
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new AnalysisError(LLM_INVALID_OUTPUT, "LLM provider returned a malformed response.");
      }

      const content = readMessageContent(body);
      return parseLlmJson(content);
    },
  };
}

export function parseLlmJson(content: string): ScreeningAnalysis {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new AnalysisError(LLM_INVALID_OUTPUT, "LLM provider returned invalid JSON.");
  }
  try {
    return parseScreeningAnalysis(parsed);
  } catch {
    throw new AnalysisError(LLM_INVALID_OUTPUT, "LLM provider returned an invalid analysis shape.");
  }
}

function readMessageContent(body: unknown): string {
  if (!body || typeof body !== "object") {
    throw new AnalysisError(LLM_INVALID_OUTPUT, "LLM provider returned a malformed response.");
  }
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") {
    throw new AnalysisError(LLM_INVALID_OUTPUT, "LLM provider returned a malformed response.");
  }
  const content = (choices[0] as { message?: { content?: unknown } }).message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new AnalysisError(LLM_INVALID_OUTPUT, "LLM provider returned empty analysis content.");
  }
  return content;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
