import type { BusinessCaseType } from "@/types";

export type EmailDraftSignal = {
  type: string;
  title: string;
};

export type EmailDraftContact = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
};

export type EmailDraftActivity = {
  type: string;
  outcome?: string | null;
};

export type EmailDraftBusinessCase = {
  type: BusinessCaseType;
  reasons: string[];
  supportingSignals: string[];
  valuePropositions: string[];
};

export type EmailDraftService = {
  name: string;
  valuePropositions?: string[];
  conversationStarter?: string | null;
};

export type EmailDraftInput = {
  companyName: string;
  recommendedContact: EmailDraftContact | null;
  primaryServiceRecommendation: EmailDraftService | null;
  primaryBusinessCase: EmailDraftBusinessCase | null;
  supportingSignals: EmailDraftSignal[];
  conversationStarter?: string | null;
  activities?: EmailDraftActivity[];
};

export type EmailDraftBasis = {
  signal: string | null;
  businessCase: string | null;
  valueProposition: string | null;
  service: string | null;
};

export type EmailDraft = {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  fullText: string;
  recipientName: string | null;
  recipientEmail: string | null;
  serviceName: string | null;
  businessCaseType: BusinessCaseType | null;
  evidenceSignals: string[];
  valueProposition: string | null;
  basis: EmailDraftBasis;
};

export type OutreachStance = "first" | "follow_up" | "continue";
