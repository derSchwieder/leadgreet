import { z } from "zod";
import {
  ACTIVITY_OUTCOMES,
  ACTIVITY_TYPES,
  BUSINESS_CASE_TYPES,
  COMPANY_SIZES,
  CONTACT_ROLES,
  CONTENT_TYPES,
  IRRELEVANT_FEEDBACK_REASONS,
  OPPORTUNITY_STATUSES,
  RELEVANT_FEEDBACK_REASONS,
  SIGNAL_FEEDBACK_REASONS,
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
  notes: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
  isDecisionMaker: z.boolean().optional().default(false),
  confidenceScore: z.coerce.number().int().min(0).max(100).optional().default(50),
});

export const updateContactSchema = createContactSchema.omit({ companyId: true }).partial();

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

const companySizeEnum = z.enum(COMPANY_SIZES as unknown as [string, ...string[]]);
const contactRoleEnum = z.enum(CONTACT_ROLES as unknown as [string, ...string[]]);
const signalTypeEnum = z.enum(SIGNAL_TYPES as unknown as [string, ...string[]]);
const businessCaseTypeEnum = z.enum(
  BUSINESS_CASE_TYPES as unknown as [string, ...string[]],
);

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
  targetIndustries: z.array(z.string().trim().min(1).max(120)).optional().default([]),
  targetCompanySizes: z.array(companySizeEnum).optional().default([]),
  targetRoles: z.array(contactRoleEnum).optional().default([]),
  matchingSignalTypes: z.array(signalTypeEnum).optional().default([]),
  businessCaseTypes: z.array(businessCaseTypeEnum).optional().default([]),
  valuePropositions: z.array(z.string().trim().min(1).max(400)).optional().default([]),
  conversationStarter: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
  isActive: z.boolean().optional().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

const activityTypeEnum = z.enum(ACTIVITY_TYPES as unknown as [string, ...string[]]);
const activityOutcomeEnum = z.enum(ACTIVITY_OUTCOMES as unknown as [string, ...string[]]);
const opportunityStatusEnum = z.enum(OPPORTUNITY_STATUSES as unknown as [string, ...string[]]);

export const createActivitySchema = z.object({
  opportunityId: z.string().trim().min(1),
  companyId: z.string().trim().min(1),
  contactId: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  userId: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  type: activityTypeEnum,
  subject: z.preprocess(emptyToNull, z.string().trim().max(300).nullable()),
  note: z.preprocess(emptyToNull, z.string().trim().max(8000).nullable()),
  occurredAt: z.coerce.date(),
  outcome: z.preprocess(emptyToNull, activityOutcomeEnum.nullable()),
  outcomeNote: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
  responseToActivityId: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
});

export const updateActivitySchema = createActivitySchema
  .omit({ opportunityId: true, companyId: true })
  .partial();

export const createSalesTodoSchema = z.object({
  opportunityId: z.string().trim().min(1),
  companyId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(300),
  dueAt: z.coerce.date(),
  contactId: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  relatedActivityId: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
});

export const completeSalesTodoSchema = z.object({
  status: z.literal("DONE"),
});

export const createStatusHistorySchema = z.object({
  accountId: z.string().trim().min(1).optional(),
  opportunityId: z.string().trim().min(1),
  userId: z.preprocess(emptyToNull, z.string().trim().min(1).nullable()),
  fromStatus: z.preprocess(emptyToNull, opportunityStatusEnum.nullable()),
  toStatus: opportunityStatusEnum,
  note: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
  changedAt: z.coerce.date().optional(),
});

export const updateOpportunityStatusSchema = z.object({
  toStatus: opportunityStatusEnum,
  note: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
});

const contentTypeEnum = z.enum(CONTENT_TYPES as unknown as [string, ...string[]]);

const optionalUrl = z.preprocess((value) => {
  if (value === "" || value === undefined) return null;
  return value;
}, z
  .string()
  .trim()
  .url()
  .max(1000)
  .refine((value) => /^https?:\/\//i.test(value), "Nur http- oder https-URLs")
  .nullable());

export const createContentItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.preprocess(emptyToNull, z.string().trim().max(4000).nullable()),
  type: contentTypeEnum,
  url: optionalUrl,
  fileName: z.preprocess(emptyToNull, z.string().trim().max(240).nullable()),
  mimeType: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  tags: z.array(z.string().trim().min(1).max(60)).optional().default([]),
  businessCaseTypes: z.array(businessCaseTypeEnum).optional().default([]),
  targetRoles: z.array(contactRoleEnum).optional().default([]),
  targetCompanySizes: z.array(companySizeEnum).optional().default([]),
  serviceIds: z.array(z.string().trim().min(1)).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateContentItemSchema = createContentItemSchema.partial();

export const requestLoginOtpSchema = z.object({
  email: z.string().trim().min(1).max(200).email(),
});

export const verifyLoginOtpSchema = z.object({
  email: z.string().trim().min(1).max(200).email(),
  otp: z.string().trim().min(1).max(32),
});

const signalFeedbackReasonEnum = z.enum(
  SIGNAL_FEEDBACK_REASONS as unknown as [string, ...string[]],
);

const nullableNonNegativeInt = z.preprocess(
  emptyToNull,
  z.union([z.null(), z.coerce.number().int().nonnegative()]),
);

const nullableNonNegativeNumber = z.preprocess(
  emptyToNull,
  z.union([z.null(), z.coerce.number().finite().nonnegative()]),
);

export const accountIcpSchema = z
  .object({
    industries: z.array(z.string().trim().min(1).max(120)).max(80).default([]),
    countries: z.array(z.string().trim().min(1).max(120)).max(80).default([]),
    minEmployees: nullableNonNegativeInt.default(null),
    minRevenue: nullableNonNegativeNumber.default(null),
  })
  .strict();

const greetThresholdSchema = z.coerce.number().int().min(0).max(100);

export const createRadarProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    industries: z.array(z.string().trim().min(1).max(120)).max(80).default([]),
    countries: z.array(z.string().trim().min(1).max(120)).max(80).default([]),
    minEmployees: nullableNonNegativeInt.default(null),
    minRevenue: nullableNonNegativeNumber.default(null),
    greetThreshold: greetThresholdSchema.default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

export const updateRadarProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    industries: z.array(z.string().trim().min(1).max(120)).max(80).optional(),
    countries: z.array(z.string().trim().min(1).max(120)).max(80).optional(),
    minEmployees: nullableNonNegativeInt.optional(),
    minRevenue: nullableNonNegativeNumber.optional(),
    greetThreshold: greetThresholdSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const accountCompanyStateSchema = z
  .object({
    status: z.enum(["NOT_RELEVANT", "DECLINED"]).nullable(),
    note: z.preprocess(emptyToNull, z.string().trim().max(500).nullable()).optional(),
  })
  .strict();

export const upsertSignalFeedbackSchema = z
  .object({
    signalId: z.string().trim().min(1),
    relevant: z.boolean(),
    reason: z.preprocess(emptyToNull, signalFeedbackReasonEnum.nullable()),
  })
  .superRefine((value, ctx) => {
    if (!value.reason) return;
    const allowed = value.relevant ? RELEVANT_FEEDBACK_REASONS : IRRELEVANT_FEEDBACK_REASONS;
    if (!allowed.includes(value.reason as (typeof allowed)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Reason does not match the selected rating",
      });
    }
  });

export function parseBody<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
