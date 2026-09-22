import { scoreCompanyGreet } from "@/lib/scoring/company-greet";
import type {
  OpportunityScoreResult,
  ScoringCompanyInput,
  ScoringContactInput,
  ScoringSignalInput,
} from "@/lib/scoring";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

/** Same window as createOpportunity: newest non-dismissed company signals. */
export const COMPANY_GREET_SIGNAL_TAKE = 5;

type GreetSource = {
  sourceType: ScoringSignalInput["sourceType"];
  credibilityScore: number;
} | null;

type GreetSignalRecord = {
  type: ScoringSignalInput["type"];
  detectedAt: Date;
  eventDate: Date | null;
  sourceUrl: string | null;
  title: string;
  description: string | null;
  source?: GreetSource;
};

type GreetCompanyRecord = {
  industry: string | null;
  subIndustry: string | null;
  country: string | null;
  employees: number | null;
  companySize: ScoringCompanyInput["companySize"];
  website: string | null;
  city: string | null;
  revenue: { toString(): string } | string | null;
};

type GreetContactRecord = {
  role: ScoringContactInput["role"];
  isDecisionMaker: boolean;
  confidenceScore: number;
  email: string | null;
  linkedinUrl: string | null;
  department: string | null;
};

function toScoringCompany(company: GreetCompanyRecord): ScoringCompanyInput {
  return {
    industry: company.industry,
    subIndustry: company.subIndustry,
    country: company.country,
    employees: company.employees,
    companySize: company.companySize,
    website: company.website,
    city: company.city,
    revenue: company.revenue?.toString() ?? null,
  };
}

function toScoringSignals(signals: GreetSignalRecord[]): ScoringSignalInput[] {
  return signals.map((signal) => ({
    type: signal.type,
    detectedAt: signal.detectedAt,
    eventDate: signal.eventDate,
    sourceType: signal.source?.sourceType ?? null,
    sourceCredibility: signal.source?.credibilityScore ?? null,
    sourceUrl: signal.sourceUrl,
    title: signal.title,
    description: signal.description,
  }));
}

function toScoringContact(contact: GreetContactRecord | null): ScoringContactInput | null {
  if (!contact) return null;
  return {
    role: contact.role,
    isDecisionMaker: contact.isDecisionMaker,
    confidenceScore: contact.confidenceScore,
    email: contact.email,
    linkedinUrl: contact.linkedinUrl,
    department: contact.department,
  };
}

export function computeCompanyGreet(input: {
  company: GreetCompanyRecord;
  signals: GreetSignalRecord[];
  contact: GreetContactRecord | null;
  now?: Date;
}): OpportunityScoreResult {
  return scoreCompanyGreet({
    company: toScoringCompany(input.company),
    signals: toScoringSignals(input.signals),
    contact: toScoringContact(input.contact),
    now: input.now,
  });
}

const greetSignalInclude = {
  source: {
    select: {
      sourceType: true,
      credibilityScore: true,
    },
  },
} as const;

export async function getCompanyGreet(
  companyId: string,
  now: Date = new Date(),
): Promise<OpportunityScoreResult> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new NotFoundError("Company", companyId);
  }

  const [signals, contact] = await Promise.all([
    prisma.signal.findMany({
      where: { companyId, status: { not: "DISMISSED" } },
      include: greetSignalInclude,
      orderBy: { detectedAt: "desc" },
      take: COMPANY_GREET_SIGNAL_TAKE,
    }),
    prisma.contact.findFirst({
      where: { companyId },
      orderBy: [{ isDecisionMaker: "desc" }, { confidenceScore: "desc" }],
      select: {
        role: true,
        isDecisionMaker: true,
        confidenceScore: true,
        email: true,
        linkedinUrl: true,
        department: true,
      },
    }),
  ]);

  return computeCompanyGreet({ company, signals, contact, now });
}
