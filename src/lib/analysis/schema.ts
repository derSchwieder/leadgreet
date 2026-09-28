import { z } from "zod";
import type { ScreeningAnalysis } from "./types";

const evidenceSchema = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  publisher: z.string().optional(),
  publishedAt: z.string().optional(),
});

const confidenceSchema = z.enum(["low", "medium", "high"]);

const factSchema = z.object({
  kind: z.literal("fact"),
  statement: z.string().min(1),
  evidence: z.array(evidenceSchema).min(1),
});

const interpretationSchema = z.object({
  kind: z.literal("interpretation"),
  statement: z.string().min(1),
  evidence: z.array(evidenceSchema).min(1),
});

const conflictSchema = z.object({
  topic: z.string().min(1),
  values: z
    .array(
      z.object({
        value: z.string().min(1),
        source: z.string().min(1),
        publishedAt: z.string().optional(),
      }),
    )
    .min(2),
  status: z.literal("conflicting_evidence"),
});

export const screeningAnalysisSchema: z.ZodType<ScreeningAnalysis> = z.object({
  companyProfile: z.object({
    summary: z.string().min(1),
    industry: z.string().optional(),
    businessModel: z.string().optional(),
    size: z.string().optional(),
    revenue: z.string().optional(),
    technologyProfile: z.string().optional(),
    transformationProfile: z.string().optional(),
    evidence: z.array(evidenceSchema),
  }),
  facts: z.array(factSchema),
  interpretations: z.array(interpretationSchema),
  icpAssessment: z.object({
    criteria: z.array(
      z.object({
        criterion: z.enum(["industry", "geography", "size", "revenue"]),
        finding: z.string().min(1),
        status: z.enum(["supported", "not_supported", "unknown"]),
        evidence: z.array(evidenceSchema),
      }),
    ),
    summary: z.string().min(1),
    confidence: confidenceSchema,
    evidence: z.array(evidenceSchema),
  }),
  signals: z.array(
    z.object({
      type: z.string().min(1),
      title: z.string().min(1),
      description: z.string().min(1),
      category: z.enum([
        "technology",
        "transformation",
        "ai",
        "cloud",
        "hiring",
        "strategy",
        "other",
      ]),
      strength: confidenceSchema,
      evidence: z.array(evidenceSchema).min(1),
    }),
  ),
  salesHypotheses: z.array(
    z.object({
      title: z.string().min(1),
      hypothesis: z.string().min(1),
      rationale: z.string().min(1),
      relevance: confidenceSchema,
      evidence: z.array(evidenceSchema).min(1),
    }),
  ),
  relevantContacts: z.array(
    z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      company: z.string().min(1),
      profileUrl: z.string().optional(),
      evidence: z.array(evidenceSchema).min(1),
      relevance: confidenceSchema,
      relevanceReason: z.string().min(1),
      relatedSignals: z.array(z.string()),
    }),
  ),
  conflicts: z.array(conflictSchema),
  limitations: z.array(z.string()),
});

const openaiEvidence = {
  type: "object",
  additionalProperties: false,
  required: ["url", "title", "publisher", "publishedAt"],
  properties: {
    url: { type: "string" },
    title: { type: ["string", "null"] },
    publisher: { type: ["string", "null"] },
    publishedAt: { type: ["string", "null"] },
  },
} as const;

export const OPENAI_SCREENING_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "companyProfile",
    "facts",
    "interpretations",
    "icpAssessment",
    "signals",
    "salesHypotheses",
    "relevantContacts",
    "conflicts",
    "limitations",
  ],
  properties: {
    companyProfile: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary",
        "industry",
        "businessModel",
        "size",
        "revenue",
        "technologyProfile",
        "transformationProfile",
        "evidence",
      ],
      properties: {
        summary: { type: "string" },
        industry: { type: ["string", "null"] },
        businessModel: { type: ["string", "null"] },
        size: { type: ["string", "null"] },
        revenue: { type: ["string", "null"] },
        technologyProfile: { type: ["string", "null"] },
        transformationProfile: { type: ["string", "null"] },
        evidence: { type: "array", items: openaiEvidence },
      },
    },
    facts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "statement", "evidence"],
        properties: {
          kind: { type: "string", enum: ["fact"] },
          statement: { type: "string" },
          evidence: { type: "array", items: openaiEvidence },
        },
      },
    },
    interpretations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "statement", "evidence"],
        properties: {
          kind: { type: "string", enum: ["interpretation"] },
          statement: { type: "string" },
          evidence: { type: "array", items: openaiEvidence },
        },
      },
    },
    icpAssessment: {
      type: "object",
      additionalProperties: false,
      required: ["criteria", "summary", "confidence", "evidence"],
      properties: {
        criteria: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["criterion", "finding", "status", "evidence"],
            properties: {
              criterion: { type: "string", enum: ["industry", "geography", "size", "revenue"] },
              finding: { type: "string" },
              status: { type: "string", enum: ["supported", "not_supported", "unknown"] },
              evidence: { type: "array", items: openaiEvidence },
            },
          },
        },
        summary: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        evidence: { type: "array", items: openaiEvidence },
      },
    },
    signals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "description", "category", "strength", "evidence"],
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          category: {
            type: "string",
            enum: ["technology", "transformation", "ai", "cloud", "hiring", "strategy", "other"],
          },
          strength: { type: "string", enum: ["low", "medium", "high"] },
          evidence: { type: "array", items: openaiEvidence },
        },
      },
    },
    salesHypotheses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "hypothesis", "rationale", "relevance", "evidence"],
        properties: {
          title: { type: "string" },
          hypothesis: { type: "string" },
          rationale: { type: "string" },
          relevance: { type: "string", enum: ["low", "medium", "high"] },
          evidence: { type: "array", items: openaiEvidence },
        },
      },
    },
    relevantContacts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "role",
          "company",
          "profileUrl",
          "evidence",
          "relevance",
          "relevanceReason",
          "relatedSignals",
        ],
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          company: { type: "string" },
          profileUrl: { type: ["string", "null"] },
          evidence: { type: "array", items: openaiEvidence },
          relevance: { type: "string", enum: ["low", "medium", "high"] },
          relevanceReason: { type: "string" },
          relatedSignals: { type: "array", items: { type: "string" } },
        },
      },
    },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["topic", "values", "status"],
        properties: {
          topic: { type: "string" },
          values: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["value", "source", "publishedAt"],
              properties: {
                value: { type: "string" },
                source: { type: "string" },
                publishedAt: { type: ["string", "null"] },
              },
            },
          },
          status: { type: "string", enum: ["conflicting_evidence"] },
        },
      },
    },
    limitations: { type: "array", items: { type: "string" } },
  },
} as const;

export function parseScreeningAnalysis(value: unknown): ScreeningAnalysis {
  const parsed = screeningAnalysisSchema.safeParse(normalizeNullableStrings(value));
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

function normalizeNullableStrings(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) return value.map(normalizeNullableStrings);
  if (!value || typeof value !== "object") return value;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = normalizeNullableStrings(entry);
  }
  return result;
}
