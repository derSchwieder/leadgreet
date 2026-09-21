import { recommendServices } from "@/lib/recommendation";
import type { RecommendationOpportunity, RecommendationResult } from "@/lib/recommendation";
import { getOpportunityById, type OpportunityWithRelations } from "./opportunities";
import { listServices } from "./services";

function toRecommendationOpportunity(
  opportunity: OpportunityWithRelations,
): RecommendationOpportunity {
  return {
    company: {
      industry: opportunity.company.industry,
      companySize: opportunity.company.companySize,
    },
    signals: opportunity.signals.map((signal) => ({
      type: signal.type,
      title: signal.title,
      signalStrength: signal.signalStrength,
    })),
    recommendedContact: opportunity.recommendedContact
      ? { role: opportunity.recommendedContact.role }
      : null,
  };
}

/**
 * Account-scoped recommendations. Loads the opportunity and this account's
 * services, then runs the pure matching engine. Never mixes in another
 * account's portfolio.
 */
export async function getRecommendations(
  accountId: string,
  opportunityId: string,
): Promise<RecommendationResult> {
  const opportunity = await getOpportunityById(opportunityId, accountId);

  const services = await listServices(accountId);
  return recommendServices({
    opportunity: toRecommendationOpportunity(opportunity),
    services,
  });
}
