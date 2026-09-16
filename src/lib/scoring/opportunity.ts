import { scoreCompanyFit } from "./company-fit";
import { scoreConfidence } from "./confidence";
import { scoreContactFit } from "./contact-fit";
import { buildExplanation, buildWhyNow } from "./explain";
import { scoreFreshness } from "./freshness";
import { scoreSignalStrength } from "./signal-strength";
import {
  clampScore,
  contribution,
  type OpportunityScoreResult,
  type ScoreOpportunityInput,
} from "./types";
import { assertWeightsSumTo100, SCORING_WEIGHTS } from "./weights";

assertWeightsSumTo100();

export function scoreOpportunity(input: ScoreOpportunityInput): OpportunityScoreResult {
  const now = input.now ?? new Date();

  const signalStrength = scoreSignalStrength(input.signals);
  const freshness = scoreFreshness(input.signals, now);
  const companyFit = scoreCompanyFit(input.company);
  const contactFit = scoreContactFit(input.contact, input.signals);
  const confidence = scoreConfidence({
    company: input.company,
    signals: input.signals,
    contact: input.contact,
  });

  const contributions = {
    signalStrength: contribution(signalStrength.score, SCORING_WEIGHTS.signalStrength),
    freshness: contribution(freshness.score, SCORING_WEIGHTS.freshness),
    companyFit: contribution(companyFit.score, SCORING_WEIGHTS.companyFit),
    contactFit: contribution(contactFit.score, SCORING_WEIGHTS.contactFit),
    confidence: contribution(confidence.score, SCORING_WEIGHTS.confidence),
  };

  const opportunityScore = clampScore(
    contributions.signalStrength +
      contributions.freshness +
      contributions.companyFit +
      contributions.contactFit +
      contributions.confidence,
  );

  const factors = [
    ...signalStrength.factors.map((factor) => ({
      ...factor,
      code: `signalStrength.${factor.code}`,
    })),
    ...freshness.factors.map((factor) => ({
      ...factor,
      code: `freshness.${factor.code}`,
    })),
    ...companyFit.factors.map((factor) => ({
      ...factor,
      code: `companyFit.${factor.code}`,
    })),
    ...contactFit.factors.map((factor) => ({
      ...factor,
      code: `contactFit.${factor.code}`,
    })),
    ...confidence.factors.map((factor) => ({
      ...factor,
      code: `confidence.${factor.code}`,
    })),
  ];

  const partial = {
    opportunityScore,
    signalStrength: signalStrength.score,
    freshness: freshness.score,
    companyFit: companyFit.score,
    contactFit: contactFit.score,
    confidence: confidence.score,
    contributions,
    factors,
  };

  return {
    ...partial,
    explanation: buildExplanation(partial),
    whyNow: buildWhyNow(factors, freshness.score),
  };
}
