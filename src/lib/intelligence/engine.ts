import { recommendServices } from "@/lib/recommendation";
import type { ActivityOutcome, ActivityType, BusinessCaseType, ContactRole } from "@/types";
import type {
  CompanyIntelligence,
  CompanyIntelligenceInput,
  IntelligenceActivity,
  IntelligenceContact,
  IntelligenceContentItem,
  IntelligenceContentMatch,
  IntelligenceNextStep,
  IntelligenceSignal,
} from "./types";

const FOLLOW_UP_OUTCOMES = new Set<string>([
  "NO_RESPONSE",
  "FOLLOW_UP_LATER",
  "NOT_REACHABLE",
]);

const FOLLOW_UP_TYPES = new Set<string>(["FOLLOW_UP", "EMAIL_SENT", "CALL"]);

function asString(value: string): string {
  return value;
}

export function rankMatchingContacts(
  contacts: IntelligenceContact[],
  targetRoles: Array<ContactRole | string>,
): IntelligenceContact[] {
  const roles = new Set(targetRoles.map(asString));
  const pool =
    roles.size > 0 ? contacts.filter((contact) => roles.has(String(contact.role))) : [];

  return [...pool].sort((a, b) => {
    if (a.isDecisionMaker !== b.isDecisionMaker) return a.isDecisionMaker ? -1 : 1;
    return a.fullName.localeCompare(b.fullName, "de");
  });
}

export function scoreContentMatch(
  item: IntelligenceContentItem,
  context: {
    primaryServiceId: string | null;
    recommendedServiceIds: string[];
    businessCaseTypes: Array<BusinessCaseType | string>;
    contactRoles: Array<ContactRole | string>;
    companySize: string | null;
  },
): number | null {
  if (!item.isActive) return null;

  let score = 0;
  let relevant = false;
  const linkedIds = new Set(item.services.map((service) => service.id));

  if (context.primaryServiceId && linkedIds.has(context.primaryServiceId)) {
    score += 50;
    relevant = true;
  } else if (context.recommendedServiceIds.some((id) => linkedIds.has(id))) {
    score += 30;
    relevant = true;
  }

  const caseOverlap = item.businessCaseTypes.some((type) =>
    context.businessCaseTypes.includes(type),
  );
  if (caseOverlap) {
    score += 20;
    relevant = true;
  }

  const roleOverlap = item.targetRoles.some((role) => context.contactRoles.includes(role));
  if (roleOverlap) {
    score += 10;
    relevant = true;
  }

  if (
    item.targetCompanySizes.length > 0 &&
    context.companySize &&
    item.targetCompanySizes.map(String).includes(context.companySize)
  ) {
    score += 10;
  }

  return relevant ? score : null;
}

export function rankContentItems(
  items: IntelligenceContentItem[],
  context: Parameters<typeof scoreContentMatch>[1],
): IntelligenceContentMatch[] {
  return items
    .map((item) => {
      const score = scoreContentMatch(item, context);
      return score === null ? null : { item, score };
    })
    .filter((row): row is IntelligenceContentMatch => row !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.name.localeCompare(b.item.name, "de");
    });
}

export function deriveNextStep(input: {
  hasMatchingService: boolean;
  hasMatchingContact: boolean;
  hasRecommendedContent: boolean;
  activities: IntelligenceActivity[];
}): { nextStep: IntelligenceNextStep; nextStepReason: string } {
  const latest = input.activities[0];
  if (
    latest &&
    (FOLLOW_UP_TYPES.has(String(latest.type)) &&
      (latest.outcome === null || FOLLOW_UP_OUTCOMES.has(String(latest.outcome))))
  ) {
    return {
      nextStep: "CHECK_FOLLOW_UP",
      nextStepReason: "Es gibt bereits eine dokumentierte Ansprache ohne klaren Abschluss.",
    };
  }

  if (latest && String(latest.type) === "FOLLOW_UP") {
    return {
      nextStep: "CHECK_FOLLOW_UP",
      nextStepReason: "Ein Follow-up ist bereits dokumentiert und sollte geprüft werden.",
    };
  }

  if (input.hasRecommendedContent && input.hasMatchingContact) {
    return {
      nextStep: "SEND_CONTENT",
      nextStepReason: "Es liegen ein passender Ansprechpartner und ein zugeordneter Vertriebsinhalt vor.",
    };
  }

  if (input.hasMatchingContact) {
    return {
      nextStep: "CONTACT_EXISTING",
      nextStepReason: "Ein passender Ansprechpartner ist bereits vorhanden.",
    };
  }

  if (input.hasMatchingService) {
    return {
      nextStep: "PREPARE_OUTREACH",
      nextStepReason: "Es gibt einen passenden Anlass und ein eigenes Leistungsangebot, aber noch keinen passenden Kontakt.",
    };
  }

  return {
    nextStep: "PREPARE_OUTREACH",
    nextStepReason: "Der nächste sinnvolle Schritt ist, eine Kontaktaufnahme vorzubereiten.",
  };
}

function pickTriggerSignal(
  signals: IntelligenceSignal[],
  matchedTitles: string[],
): IntelligenceSignal | null {
  if (signals.length === 0) return null;
  const matched = new Set(matchedTitles);
  const pool = matched.size > 0 ? signals.filter((signal) => matched.has(signal.title)) : signals;
  return [...pool].sort((a, b) => {
    if (b.signalStrength !== a.signalStrength) return b.signalStrength - a.signalStrength;
    return b.detectedAt.getTime() - a.detectedAt.getTime();
  })[0] ?? null;
}

export function buildCompanyIntelligence(input: CompanyIntelligenceInput): CompanyIntelligence {
  const recommendation = recommendServices({
    opportunity: {
      company: {
        industry: input.company.industry,
        companySize: input.company.companySize,
      },
      signals: input.signals.map((signal) => ({
        type: String(signal.type),
        title: signal.title,
        signalStrength: signal.signalStrength,
      })),
      recommendedContact: null,
    },
    services: input.services,
  });

  const primaryService = recommendation.primaryRecommendation;
  const targetRoles = primaryService?.service.targetRoles ?? [];
  const matchingContact = rankMatchingContacts(input.contacts, targetRoles)[0] ?? null;
  const attachedCases = primaryService?.businessCases ?? recommendation.businessCases;
  const businessCaseTypes = attachedCases.map((item) => item.type);

  const rankedContent = rankContentItems(input.contentItems, {
    primaryServiceId: primaryService?.service.id ?? null,
    recommendedServiceIds: recommendation.recommendations
      .map((item) => item.service.id)
      .filter((id): id is string => Boolean(id)),
    businessCaseTypes,
    contactRoles: matchingContact ? [matchingContact.role] : targetRoles,
    companySize: input.company.companySize ? String(input.company.companySize) : null,
  });

  const recentActivities = [...input.activities]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 5);

  const next = deriveNextStep({
    hasMatchingService: Boolean(primaryService),
    hasMatchingContact: Boolean(matchingContact),
    hasRecommendedContent: rankedContent.length > 0,
    activities: recentActivities,
  });

  return {
    accountId: input.accountId,
    company: input.company,
    triggerSignal: pickTriggerSignal(input.signals, primaryService?.matchedSignals ?? []),
    primaryService,
    businessCases: attachedCases,
    primaryBusinessCase:
      primaryService?.primaryBusinessCase ?? recommendation.primaryBusinessCase,
    matchingContact,
    recommendedContent: rankedContent[0] ?? null,
    recentActivities,
    nextStep: next.nextStep,
    nextStepReason: next.nextStepReason,
  };
}

export function isFollowUpActivity(
  type: ActivityType | string,
  outcome: ActivityOutcome | string | null,
): boolean {
  return (
    FOLLOW_UP_TYPES.has(String(type)) &&
    (outcome === null || FOLLOW_UP_OUTCOMES.has(String(outcome)))
  );
}
