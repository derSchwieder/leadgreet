export const LLM_API_KEY_MISSING = "LLM_API_KEY_MISSING";
export const LLM_INVALID_OUTPUT = "LLM_INVALID_OUTPUT";
export const LLM_PROVIDER_ERROR = "LLM_PROVIDER_ERROR";

export class AnalysisError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
  }
}
