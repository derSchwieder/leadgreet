import type { CompanySize, ContactRole, SignalType, SourceType } from "@/types";
import type { ScoreFactor } from "@/types/models";

export interface ScoringCompanyInput {
  industry: string | null;
  subIndustry: string | null;
  country: string | null;
  employees: number | null;
  companySize: CompanySize | null;
  website: string | null;
  city: string | null;
  revenue: string | null;
}

export interface ScoringSignalInput {
  type: SignalType;
  detectedAt: Date;
  eventDate: Date | null;
  sourceType: SourceType | null;
  sourceCredibility: number | null;
  sourceUrl: string | null;
  title: string;
  description: string | null;
}

export interface ScoringContactInput {
  role: ContactRole;
  isDecisionMaker: boolean;
  confidenceScore: number;
  email: string | null;
  linkedinUrl: string | null;
  department: string | null;
}

export interface ComponentScoreResult {
  score: number;
  factors: ScoreFactor[];
}

export interface OpportunityScoreResult {
  opportunityScore: number;
  signalStrength: number;
  freshness: number;
  companyFit: number;
  contactFit: number;
  confidence: number;
  contributions: {
    signalStrength: number;
    freshness: number;
    companyFit: number;
    contactFit: number;
    confidence: number;
  };
  factors: ScoreFactor[];
  explanation: string;
  whyNow: string;
}

export interface ScoreOpportunityInput {
  company: ScoringCompanyInput;
  signals: ScoringSignalInput[];
  contact: ScoringContactInput | null;
  now?: Date;
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function contribution(score: number, weight: number): number {
  return Math.round(((clampScore(score) / 100) * weight) * 10) / 10;
}
