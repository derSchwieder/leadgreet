import { z } from "zod";
import {
  COMPANY_SIZES,
  CONTACT_ROLES,
  OPPORTUNITY_STATUSES,
  SIGNAL_STATUSES,
  SIGNAL_TYPES,
  SOURCE_TYPES,
} from "@/types";

const emptyToNull = (value: unknown) => {
  if (value === "" || value === undefined) return null;
  return value;
};

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(200),
  legalName: z.preprocess(emptyToNull, z.string().trim().max(200).nullable()),
  website: z.preprocess(emptyToNull, z.string().trim().url().max(500).nullable()),
  industry: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  subIndustry: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  city: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  region: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  country: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  employees: z.preprocess(emptyToNull, z.coerce.number().int().nonnegative().nullable()),
  revenue: z.preprocess(emptyToNull, z.string().trim().max(40).nullable()),
  revenueCurrency: z.preprocess(emptyToNull, z.string().trim().max(8).nullable()),
  revenueYear: z.preprocess(
    emptyToNull,
    z.coerce.number().int().min(1900).max(2100).nullable(),
  ),
  companySize: z.preprocess(
    emptyToNull,
    z.enum(COMPANY_SIZES as unknown as [string, ...string[]]).nullable(),
  ),
  ownership: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  description: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
});

export const createSourceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.preprocess(emptyToNull, z.string().trim().url().max(1000).nullable()),
  sourceType: z.enum(SOURCE_TYPES as unknown as [string, ...string[]]),
  publishedAt: z.preprocess(emptyToNull, z.coerce.date().nullable()),
  accessedAt: z.preprocess(emptyToNull, z.coerce.date().nullable()),
  credibilityScore: z.coerce.number().int().min(0).max(100).optional().default(50),
});

export const createSignalSchema = z.object({
  companyId: z.string().trim().min(1),
  type: z.enum(SIGNAL_TYPES as unknown as [string, ...string[]]),
  title: z.string().trim().min(1).max(300),
  description: z.preprocess(emptyToNull, z.string().trim().max(8000).nullable()),
  detectedAt: z.coerce.date().optional(),
  eventDate: z.preprocess(emptyToNull, z.coerce.date().nullable()),
  sourceId: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  sourceUrl: z.preprocess(emptyToNull, z.string().trim().url().max(1000).nullable()),
  sourceName: z.preprocess(emptyToNull, z.string().trim().max(200).nullable()),
  status: z
    .enum(SIGNAL_STATUSES as unknown as [string, ...string[]])
    .optional()
    .default("NEW"),
});

export const createContactSchema = z.object({
  companyId: z.string().trim().min(1),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  role: z.enum(CONTACT_ROLES as unknown as [string, ...string[]]),
  department: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  email: z.preprocess(emptyToNull, z.string().trim().email().max(200).nullable()),
  phone: z.preprocess(emptyToNull, z.string().trim().max(60).nullable()),
  linkedinUrl: z.preprocess(emptyToNull, z.string().trim().url().max(500).nullable()),
  sourceUrl: z.preprocess(emptyToNull, z.string().trim().url().max(500).nullable()),
  isDecisionMaker: z.boolean().optional().default(false),
  confidenceScore: z.coerce.number().int().min(0).max(100).optional().default(50),
});

export const createOpportunitySchema = z.object({
  companyId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.preprocess(emptyToNull, z.string().trim().max(8000).nullable()),
  recommendedApproach: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
  whyNow: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
  status: z
    .enum(OPPORTUNITY_STATUSES as unknown as [string, ...string[]])
    .optional()
    .default("NEW"),
  recommendedContactId: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  signalIds: z.array(z.string().trim().min(1)).optional().default([]),
});

export function parseBody<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
