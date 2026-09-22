export { scoreOpportunity } from "./opportunity";
export { scoreCompanyGreet } from "./company-greet";
export { scoreSignalStrength } from "./signal-strength";
export { scoreFreshness, signalAgeDays } from "./freshness";
export { scoreCompanyFit } from "./company-fit";
export { scoreContactFit } from "./contact-fit";
export { scoreConfidence } from "./confidence";
export {
  SCORING_WEIGHTS,
  SCORING_DIMENSIONS,
  HOT_OPPORTUNITY_THRESHOLD,
  TARGET_COMPANY_PROFILE,
} from "./weights";
export { SIGNAL_TYPE_BASE_STRENGTH } from "./signal-strength";
export type {
  ScoreOpportunityInput,
  OpportunityScoreResult,
  ScoringCompanyInput,
  ScoringSignalInput,
  ScoringContactInput,
} from "./types";
