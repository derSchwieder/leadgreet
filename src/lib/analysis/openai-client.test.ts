import { describe, expect, it, vi } from "vitest";
import { LLM_API_KEY_MISSING, LLM_INVALID_OUTPUT, LLM_PROVIDER_ERROR } from "./errors";
import { mockScreeningAnalysis } from "./mock";
import {
  createOpenAiCompletionClient,
  llmApiKeyFromEnv,
  llmModelFromEnv,
  OPENAI_CHAT_COMPLETIONS_URL,
  parseLlmJson,
} from "./openai-client";

const researchUrl = "https://www.datev.de";

function validPayload() {
  return mockScreeningAnalysis({
    company: { name: "DATEV" },
    research: { queries: [], results: [{ title: "DATEV", url: researchUrl }] },
  });
}

function completionResponse(content: string, status = 200): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
    }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

describe("OpenAI completion client", () => {
  it("reads the API key and model from environment variables", () => {
    expect(llmApiKeyFromEnv({})).toBeNull();
    expect(llmApiKeyFromEnv({ LLM_API_KEY: "  sk-test  " })).toBe("sk-test");
    expect(llmModelFromEnv({})).toBe("gpt-4o-mini");
    expect(llmModelFromEnv({ LLM_MODEL: "gpt-4.1-mini" })).toBe("gpt-4.1-mini");
  });

  it("fails without an API key and never calls fetch", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const client = createOpenAiCompletionClient({ apiKey: null, fetchImpl });
    await expect(
      client.completeJson({ system: "sys", user: "user" }),
    ).rejects.toMatchObject({ code: LLM_API_KEY_MISSING });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("parses a valid structured completion without a live request", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      completionResponse(JSON.stringify(validPayload())),
    );
    const client = createOpenAiCompletionClient({
      apiKey: "sk-test",
      fetchImpl,
    });
    const analysis = await client.completeJson({ system: "sys", user: "user" });
    expect(analysis.companyProfile.summary).toContain("DATEV");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(OPENAI_CHAT_COMPLETIONS_URL);
    expect(init && typeof init === "object" && "headers" in init).toBe(true);
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(String((init as RequestInit).body)).not.toContain("sk-test");
  });

  it("rejects invalid JSON output", async () => {
    const client = createOpenAiCompletionClient({
      apiKey: "sk-test",
      fetchImpl: async () => completionResponse("not-json"),
    });
    await expect(client.completeJson({ system: "sys", user: "user" })).rejects.toMatchObject({
      code: LLM_INVALID_OUTPUT,
    });
  });

  it("rejects a completion that does not match the analysis schema", () => {
    expect(() => parseLlmJson(JSON.stringify({ companyProfile: {} }))).toThrow(
      expect.objectContaining({ code: LLM_INVALID_OUTPUT }),
    );
  });

  it("maps HTTP failures to LLM_PROVIDER_ERROR", async () => {
    const client = createOpenAiCompletionClient({
      apiKey: "sk-test",
      fetchImpl: async () => new Response("nope", { status: 500 }),
    });
    await expect(client.completeJson({ system: "sys", user: "user" })).rejects.toMatchObject({
      code: LLM_PROVIDER_ERROR,
    });
  });

  it("maps network failures to LLM_PROVIDER_ERROR", async () => {
    const client = createOpenAiCompletionClient({
      apiKey: "sk-test",
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      },
    });
    await expect(client.completeJson({ system: "sys", user: "user" })).rejects.toMatchObject({
      code: LLM_PROVIDER_ERROR,
    });
  });
});
