import type { BusinessCaseType } from "@/types";
import {
  BUSINESS_CASE_HYPOTHESIS,
  businessCaseLabel,
  companyInTemplate,
  DEFAULT_CONVERSATION_ASK,
  EMAIL_CLOSING,
  SIGNAL_SUBJECT_FALLBACK,
  signalOccasion,
  signalTypeLabel,
  SUBJECT_BY_BUSINESS_CASE,
} from "./templates";
import type {
  EmailDraft,
  EmailDraftActivity,
  EmailDraftContact,
  EmailDraftInput,
  EmailDraftSignal,
  OutreachStance,
} from "./types";
import type { RecommendationResult } from "@/lib/recommendation";

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function outreachStance(activities: EmailDraftActivity[] = []): OutreachStance {
  const hasResponse = activities.some(
    (activity) =>
      activity.type === "EMAIL_RECEIVED" ||
      activity.outcome === "RESPONSE_RECEIVED" ||
      activity.outcome === "CALLBACK_RECEIVED" ||
      activity.outcome === "INTERESTED" ||
      activity.outcome === "MEETING_AGREED",
  );
  if (hasResponse) return "continue";

  const hasUnansweredOutreach = activities.some(
    (activity) =>
      (activity.type === "EMAIL_SENT" || activity.type === "FOLLOW_UP") &&
      (activity.outcome === "NO_RESPONSE" || !activity.outcome),
  );
  if (hasUnansweredOutreach) return "follow_up";

  return "first";
}

function greetingFor(contact: EmailDraftContact | null): {
  greeting: string;
  recipientName: string | null;
} {
  const firstName = firstNonEmpty(contact?.firstName, contact?.fullName?.split(/\s+/)[0]);
  if (firstName) {
    return { greeting: `Hallo ${firstName},`, recipientName: firstName };
  }
  return { greeting: "Hallo,", recipientName: null };
}

function pickSignal(input: EmailDraftInput): EmailDraftSignal | null {
  const fromCase = input.primaryBusinessCase?.supportingSignals ?? [];
  const byTitle = new Map(input.supportingSignals.map((signal) => [signal.title, signal]));
  for (const title of fromCase) {
    const match = byTitle.get(title);
    if (match) return match;
  }
  return input.supportingSignals[0] ?? null;
}

function pickValueProposition(input: EmailDraftInput): string | null {
  return (
    firstNonEmpty(
      ...(input.primaryBusinessCase?.valuePropositions ?? []),
      ...(input.primaryServiceRecommendation?.valuePropositions ?? []),
    ) ?? null
  );
}

function pickConversationStarter(input: EmailDraftInput): string | null {
  return firstNonEmpty(
    input.conversationStarter,
    input.primaryServiceRecommendation?.conversationStarter,
  );
}

function opener(stance: OutreachStance): string | null {
  if (stance === "follow_up") {
    return "ich wollte mich zu meiner Nachricht noch einmal kurz melden.";
  }
  if (stance === "continue") {
    return "im Anschluss an unseren bisherigen Austausch wollte ich das Thema noch einmal aufgreifen.";
  }
  return null;
}

function signalSentence(companyName: string, signal: EmailDraftSignal | null): string | null {
  if (!signal) return null;
  const occasion = signalOccasion(signal.type);
  return `mir ist aufgefallen, dass bei ${companyName} derzeit ${occasion} sichtbar ist.`;
}

function interpretationSentence(
  type: BusinessCaseType | null,
  reasons: string[],
): string | null {
  if (!type) return null;
  const label = businessCaseLabel(type);
  const specific = reasons.find((reason) => reason !== `Möglicher Business Case: ${label}`);
  if (specific) return ensureSentence(specific);
  return BUSINESS_CASE_HYPOTHESIS[type];
}

function valueSentence(label: string | null, valueProposition: string | null): string | null {
  if (!valueProposition) return null;
  if (label) {
    return `Gerade mit Blick auf den möglichen Hebel „${label}“ kann dieser Ansatz relevant sein: ${valueProposition}.`;
  }
  return `Dazu könnte dieser Ansatz relevant sein: ${valueProposition}.`;
}

function serviceSentence(serviceName: string | null): string | null {
  if (!serviceName) return null;
  return `Wir unterstützen Unternehmen in solchen Situationen mit ${serviceName}.`;
}

function ctaSentence(starter: string | null): string {
  if (!starter) return DEFAULT_CONVERSATION_ASK;
  const trimmed = starter.replace(/\s+/g, " ").trim();
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

function joinParagraphs(parts: Array<string | null>): string {
  return parts
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n");
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

/**
 * Deterministic email draft from existing sales-intelligence data.
 * Does not invent contacts, financial outcomes, or unsupported business cases.
 */
export function composeEmailDraft(input: EmailDraftInput): EmailDraft {
  const stance = outreachStance(input.activities);
  const { greeting, recipientName } = greetingFor(input.recommendedContact);
  const signal = pickSignal(input);
  const businessCase = input.primaryBusinessCase;
  const businessCaseType = businessCase?.type ?? null;
  const label = businessCaseType ? businessCaseLabel(businessCaseType) : null;
  const serviceName = input.primaryServiceRecommendation?.name ?? null;
  const valueProposition = pickValueProposition(input);
  const conversationStarter = pickConversationStarter(input);

  const subject = businessCaseType
    ? companyInTemplate(SUBJECT_BY_BUSINESS_CASE[businessCaseType], input.companyName)
    : signal
      ? companyInTemplate(SIGNAL_SUBJECT_FALLBACK, input.companyName)
      : `Kurze Nachfrage bei ${input.companyName}`;

  const continuedOccasion =
    stance !== "first" && signal
      ? `Anlass ist weiterhin, dass bei ${input.companyName} ${signalOccasion(signal.type)} sichtbar ist.`
      : null;

  const body = joinParagraphs([
    opener(stance),
    stance === "first" ? signalSentence(input.companyName, signal) : continuedOccasion,
    interpretationSentence(businessCaseType, businessCase?.reasons ?? []),
    valueSentence(label, valueProposition),
    serviceSentence(serviceName),
    ctaSentence(conversationStarter),
  ]);

  const fullText = [greeting, "", body, "", EMAIL_CLOSING].join("\n");
  const evidenceSignals = (businessCase?.supportingSignals.length
    ? businessCase.supportingSignals
    : input.supportingSignals.map((item) => item.title)
  ).filter(Boolean);

  return {
    subject,
    greeting,
    body: ensureSentence(body),
    closing: EMAIL_CLOSING,
    fullText,
    recipientName,
    recipientEmail: firstNonEmpty(input.recommendedContact?.email),
    serviceName,
    businessCaseType,
    evidenceSignals,
    valueProposition,
    basis: {
      signal: signal
        ? `${signalTypeLabel(signal.type)}${signal.title ? ` — ${signal.title}` : ""}`
        : null,
      businessCase: label ? `Möglicher Business Case: ${label}` : null,
      valueProposition,
      service: serviceName,
    },
  };
}

export function formatEmailDraftForCopy(draft: EmailDraft): string {
  return `Betreff: ${draft.subject}\n\n${draft.fullText}`;
}

export function toEmailDraftInput(args: {
  companyName: string;
  recommendedContact: EmailDraftContact | null;
  recommendation: RecommendationResult;
  signals: EmailDraftSignal[];
  activities?: EmailDraftActivity[];
}): EmailDraftInput {
  const primary = args.recommendation.primaryRecommendation;
  const businessCase = args.recommendation.primaryBusinessCase;
  const attached = businessCase
    ? primary?.businessCases.find((item) => item.type === businessCase.type)
    : null;

  return {
    companyName: args.companyName,
    recommendedContact: args.recommendedContact,
    primaryServiceRecommendation: primary
      ? {
          name: primary.service.name,
          valuePropositions:
            attached?.valuePropositions ?? primary.service.valuePropositions ?? [],
          conversationStarter: primary.conversationStarter,
        }
      : null,
    primaryBusinessCase: businessCase
      ? {
          type: businessCase.type,
          reasons: businessCase.reasons,
          supportingSignals: businessCase.supportingSignals,
          valuePropositions: attached?.valuePropositions ?? businessCase.valuePropositions,
        }
      : null,
    supportingSignals: args.signals,
    conversationStarter: primary?.conversationStarter ?? null,
    activities: args.activities ?? [],
  };
}
