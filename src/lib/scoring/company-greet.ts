import { scoreOpportunity } from "./opportunity";
import type { OpportunityScoreResult, ScoreOpportunityInput } from "./types";

/**
 * Company-Greet uses the existing opportunity scoring formula 1:1.
 * Callers pass the company's current relevant signals instead of a
 * stored opportunity snapshot.
 */
export function scoreCompanyGreet(input: ScoreOpportunityInput): OpportunityScoreResult {
  return scoreOpportunity(input);
}
