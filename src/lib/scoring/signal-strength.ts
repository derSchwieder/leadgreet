import type { SignalType, SourceType } from "@/types";
import { clampScore, type ComponentScoreResult, type ScoringSignalInput } from "./types";

/**
 * Base intensity of a signal type for sales outreach (0–100).
 * Higher = more immediate buying intent for IT / AI / transformation work.
 */
export const SIGNAL_TYPE_BASE_STRENGTH: Record<SignalType, number> = {
  AI_PROJECT: 92,
  AI_STRATEGY: 88,
  AI_RECRUITING: 78,
  AI_AGENT: 94,
  GENAI: 90,
  CLOUD_MIGRATION: 86,
  DATA_PLATFORM: 84,
  DATA_ANALYTICS: 76,
  ERP_TRANSFORMATION: 88,
  SOFTWARE_MODERNIZATION: 82,
  PROCESS_AUTOMATION: 80,
  DIGITAL_TRANSFORMATION: 74,
  IT_REORGANIZATION: 72,
  NEW_CIO: 85,
  NEW_CTO: 84,
  NEW_CDO: 83,
  NEW_INNOVATION_LEAD: 80,
  EXPANSION: 70,
  INVESTMENT: 78,
  FUNDING: 80,
  M_AND_A: 82,
  IT_RECRUITING: 68,
  OTHER: 50,
};

const SOURCE_TYPE_BOOST: Record<SourceType, number> = {
  COMPANY_WEBSITE: 8,
  PRESS_RELEASE: 10,
  NEWS: 4,
  JOB_POSTING: 6,
  ANNUAL_REPORT: 9,
  FUNDING: 8,
  PUBLIC_TENDER: 12,
  OTHER: 0,
};

export function scoreSignalStrength(
  signals: ScoringSignalInput[],
): ComponentScoreResult {
  if (signals.length === 0) {
    return {
      score: 0,
      factors: [
        {
          code: "no_signal",
          label: "No current signal",
          points: 0,
          detail: "No signals were provided for this opportunity.",
        },
      ],
    };
  }

  const ranked = [...signals].sort(
    (a, b) => SIGNAL_TYPE_BASE_STRENGTH[b.type] - SIGNAL_TYPE_BASE_STRENGTH[a.type],
  );
  const primary = ranked[0];
  if (!primary) {
    return { score: 0, factors: [] };
  }

  const factors: ComponentScoreResult["factors"] = [];
  let score = SIGNAL_TYPE_BASE_STRENGTH[primary.type];

  factors.push({
    code: "signal_type",
    label: "Primary signal type",
    points: score,
    detail: `${primary.type.replaceAll("_", " ")} has a base strength of ${score}.`,
  });

  if (primary.sourceType) {
    const boost = SOURCE_TYPE_BOOST[primary.sourceType];
    score += boost;
    factors.push({
      code: "source_type",
      label: "Source type",
      points: boost,
      detail: `${primary.sourceType.replaceAll("_", " ")} adds ${boost} points.`,
    });
  }

  if (primary.sourceCredibility !== null) {
    const adj = Math.round((primary.sourceCredibility - 50) / 10);
    if (adj !== 0) {
      score += adj;
      factors.push({
        code: "source_credibility",
        label: "Source credibility",
        points: adj,
        detail: `Credibility ${primary.sourceCredibility}/100 adjusts strength by ${adj}.`,
      });
    }
  }

  if (signals.length > 1) {
    const extra = Math.min(8, (signals.length - 1) * 3);
    score += extra;
    factors.push({
      code: "multiple_signals",
      label: "Supporting signals",
      points: extra,
      detail: `${signals.length} related signals reinforce the opportunity.`,
    });
  }

  return { score: clampScore(score), factors };
}
