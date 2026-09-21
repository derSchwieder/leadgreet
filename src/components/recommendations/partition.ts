import type { RecommendationResult, ServiceRecommendation } from "@/lib/recommendation";

export type RecommendationView = {
  name: string;
  matchScore: number;
  reasons: string[];
  matchedSignals: string[];
  conversationStarter: string | null;
};

export function toRecommendationView(row: ServiceRecommendation): RecommendationView {
  return {
    name: row.service.name,
    matchScore: row.matchScore,
    reasons: row.reasons,
    matchedSignals: row.matchedSignals,
    conversationStarter: row.conversationStarter,
  };
}

/** Equal top scores stay together. The engine is not asked to pick a winner. */
export function partitionRecommendations(result: RecommendationResult): {
  primaries: RecommendationView[];
  alternatives: RecommendationView[];
} {
  const ranked = result.recommendations;
  const top = ranked[0];
  if (!top) {
    return { primaries: [], alternatives: [] };
  }

  return {
    primaries: ranked
      .filter((row) => row.matchScore === top.matchScore)
      .map(toRecommendationView),
    alternatives: ranked
      .filter((row) => row.matchScore < top.matchScore)
      .map(toRecommendationView),
  };
}
