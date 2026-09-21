import { SIGNAL_TYPE_LABELS } from "@/lib/labels";
import { attachBusinessCases, inferBusinessCases, selectPrimaryBusinessCase } from "./business-cases";
import type {
  RecommendationInput,
  RecommendationOpportunity,
  RecommendationService,
  ServiceMatchBreakdown,
  ServiceRecommendation,
  RecommendationResult,
} from "./types";

/** Services below this score are not recommended. */
export const MIN_RECOMMENDATION_SCORE = 55;

/**
 * Relative contribution of each fit factor. Applicable factors are
 * re-weighted so unused dimensions (empty targeting or missing data)
 * do not pull the score down.
 */
export const MATCH_WEIGHTS = {
  signal: 50,
  industry: 18,
  companySize: 14,
  contactRole: 14,
  signalStrength: 4,
} as const;

/** Unique matching signal types → 0–100 with diminishing returns. */
const UNIQUE_SIGNAL_MATCH_SCORE = [0, 74, 88, 96, 100] as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueMatchingTypes(
  service: RecommendationService,
  opportunity: RecommendationOpportunity,
): string[] {
  const allowed = new Set(service.matchingSignalTypes.map((type) => String(type)));
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const signal of opportunity.signals) {
    if (!allowed.has(signal.type) || seen.has(signal.type)) continue;
    seen.add(signal.type);
    ordered.push(signal.type);
  }
  return ordered;
}

function matchingSignals(
  service: RecommendationService,
  opportunity: RecommendationOpportunity,
) {
  const allowed = new Set(service.matchingSignalTypes.map((type) => String(type)));
  return opportunity.signals.filter((signal) => allowed.has(signal.type));
}

function signalTypeScore(uniqueCount: number): number {
  const capped = Math.min(uniqueCount, UNIQUE_SIGNAL_MATCH_SCORE.length - 1);
  return UNIQUE_SIGNAL_MATCH_SCORE[capped] ?? 100;
}

function signalReason(type: string): string {
  if (type === "CLOUD_MIGRATION") {
    return "Cloud-Migrationssignal passt zum Service";
  }
  const label = SIGNAL_TYPE_LABELS[type] ?? type;
  return `${label} passt zum Leistungsangebot`;
}

function includesNormalized(haystack: readonly string[], value: string): boolean {
  const needle = normalize(value);
  return haystack.some((item) => normalize(String(item)) === needle);
}

interface Factor {
  weight: number;
  score: number;
  applicable: boolean;
}

function combineFactors(factors: Factor[]): number {
  const used = factors.filter((factor) => factor.applicable);
  const totalWeight = used.reduce((sum, factor) => sum + factor.weight, 0);
  if (totalWeight === 0) return 0;
  const raw = used.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / totalWeight;
  return clampScore(raw);
}

export function scoreServiceMatch(
  service: RecommendationService,
  opportunity: RecommendationOpportunity,
): ServiceMatchBreakdown {
  const matched = matchingSignals(service, opportunity);
  const uniqueTypes = uniqueMatchingTypes(service, opportunity);
  const matchedSignals = [...new Set(matched.map((signal) => signal.title).filter(Boolean))];

  const industryTargets = service.targetIndustries;
  const sizeTargets = service.targetCompanySizes.map((value) => String(value));
  const roleTargets = service.targetRoles.map((value) => String(value));
  const companyIndustry = opportunity.company.industry;
  const companySize = opportunity.company.companySize;
  const contactRole = opportunity.recommendedContact?.role ?? null;

  const industryApplicable = industryTargets.length > 0 && Boolean(companyIndustry);
  const sizeApplicable = sizeTargets.length > 0 && Boolean(companySize);
  const roleApplicable = roleTargets.length > 0 && Boolean(contactRole);
  const strengthApplicable = matched.length > 0;

  const industryHit = industryApplicable && includesNormalized(industryTargets, companyIndustry!);
  const sizeHit = sizeApplicable && includesNormalized(sizeTargets, companySize!);
  const roleHit = roleApplicable && includesNormalized(roleTargets, contactRole!);

  const maxStrength = matched.reduce(
    (max, signal) => Math.max(max, Number.isFinite(signal.signalStrength) ? signal.signalStrength : 0),
    0,
  );

  const matchScore = combineFactors([
    {
      weight: MATCH_WEIGHTS.signal,
      score: signalTypeScore(uniqueTypes.length),
      applicable: true,
    },
    {
      weight: MATCH_WEIGHTS.industry,
      score: industryHit ? 100 : 0,
      applicable: industryApplicable,
    },
    {
      weight: MATCH_WEIGHTS.companySize,
      score: sizeHit ? 100 : 0,
      applicable: sizeApplicable,
    },
    {
      weight: MATCH_WEIGHTS.contactRole,
      score: roleHit ? 100 : 0,
      applicable: roleApplicable,
    },
    {
      weight: MATCH_WEIGHTS.signalStrength,
      score: clampScore(maxStrength),
      applicable: strengthApplicable,
    },
  ]);

  const reasons: string[] = [];
  if (uniqueTypes[0]) {
    reasons.push(signalReason(uniqueTypes[0]));
  }
  if (uniqueTypes.length > 1) {
    reasons.push("Mehrere passende Signale erkannt");
  }
  if (industryHit) {
    reasons.push("Branche entspricht dem Zielprofil");
  }
  if (sizeHit) {
    reasons.push("Unternehmensgröße entspricht dem Zielprofil");
  }
  if (roleHit) {
    reasons.push("Ansprechpartner passt zur Zielrolle");
  }

  return { matchScore, reasons, matchedSignals };
}

function compareRecommendations(a: ServiceRecommendation, b: ServiceRecommendation): number {
  if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
  return a.service.name.localeCompare(b.service.name, "de");
}

export function recommendServices(input: RecommendationInput): RecommendationResult {
  const businessCases = inferBusinessCases(input.opportunity.signals);

  const scored: ServiceRecommendation[] = input.services
    .filter((service) => service.isActive)
    .map((service) => {
      const match = scoreServiceMatch(service, input.opportunity);
      const attached = attachBusinessCases(service, businessCases);
      return {
        service,
        matchScore: match.matchScore,
        reasons: match.reasons,
        matchedSignals: match.matchedSignals,
        conversationStarter: service.conversationStarter,
        businessCases: attached.businessCases,
        primaryBusinessCase: attached.primaryBusinessCase,
      };
    })
    .filter((recommendation) => recommendation.matchScore >= MIN_RECOMMENDATION_SCORE)
    .sort(compareRecommendations);

  return {
    primaryRecommendation: scored[0] ?? null,
    alternativeRecommendations: scored.slice(1),
    recommendations: scored,
    businessCases,
    primaryBusinessCase: selectPrimaryBusinessCase(businessCases),
  };
}
